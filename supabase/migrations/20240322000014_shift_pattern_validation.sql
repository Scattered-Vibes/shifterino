-- Add shift pattern validation
-- Up Migration

BEGIN;

-- Create enum for shift patterns if not exists
DO $$ BEGIN
    CREATE TYPE shift_pattern_type AS ENUM ('4x10', '3x12_plus_4');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Function to calculate shift duration in hours
CREATE OR REPLACE FUNCTION calculate_shift_duration(start_time time, end_time time)
RETURNS numeric AS $$
DECLARE
    duration numeric;
BEGIN
    IF end_time < start_time THEN
        -- Overnight shift
        duration := EXTRACT(EPOCH FROM (end_time + interval '24 hours' - start_time))/3600;
    ELSE
        duration := EXTRACT(EPOCH FROM (end_time - start_time))/3600;
    END IF;
    RETURN duration;
END;
$$ LANGUAGE plpgsql;

-- Function to validate shift pattern compliance
CREATE OR REPLACE FUNCTION validate_shift_pattern()
RETURNS trigger AS $$
DECLARE
    employee_pattern shift_pattern_type;
    shift_count integer;
    consecutive_days integer;
    last_shift_date date;
    shift_duration numeric;
    four_hour_shift_count integer;
    ten_hour_shift_count integer;
    twelve_hour_shift_count integer;
BEGIN
    -- Get employee's shift pattern
    SELECT shift_pattern INTO employee_pattern
    FROM employees
    WHERE id = NEW.employee_id;

    -- Calculate shift duration
    shift_duration := calculate_shift_duration(NEW.start_time, NEW.end_time);

    -- Get counts for last 7 days including new shift
    WITH shift_counts AS (
        SELECT 
            date,
            calculate_shift_duration(start_time, end_time) as duration
        FROM individual_shifts
        WHERE employee_id = NEW.employee_id
        AND date BETWEEN NEW.date - interval '7 days' AND NEW.date
        UNION ALL
        SELECT NEW.date, shift_duration
    )
    SELECT 
        COUNT(*) FILTER (WHERE duration = 4) as four_hour_shifts,
        COUNT(*) FILTER (WHERE duration = 10) as ten_hour_shifts,
        COUNT(*) FILTER (WHERE duration = 12) as twelve_hour_shifts,
        COUNT(DISTINCT date) as total_days,
        MAX(date) as last_date
    INTO 
        four_hour_shift_count,
        ten_hour_shift_count,
        twelve_hour_shift_count,
        consecutive_days,
        last_shift_date
    FROM shift_counts;

    -- Validate pattern compliance
    CASE employee_pattern
        WHEN '4x10' THEN
            -- Pattern A: Four consecutive 10-hour shifts
            IF shift_duration != 10 THEN
                RAISE EXCEPTION 'Pattern A (4x10) requires 10-hour shifts. Got % hours.', shift_duration;
            END IF;
            
            IF ten_hour_shift_count > 4 THEN
                RAISE EXCEPTION 'Pattern A (4x10) allows maximum 4 shifts in a row. Found %.', ten_hour_shift_count;
            END IF;

            -- Check if shifts are consecutive
            IF last_shift_date IS NOT NULL AND 
               NEW.date - last_shift_date > interval '1 day' AND
               ten_hour_shift_count < 4 THEN
                RAISE EXCEPTION 'Pattern A (4x10) requires consecutive shifts. Gap found between % and %.', 
                    last_shift_date, NEW.date;
            END IF;

        WHEN '3x12_plus_4' THEN
            -- Pattern B: Three consecutive 12-hour shifts plus one 4-hour shift
            IF shift_duration NOT IN (4, 12) THEN
                RAISE EXCEPTION 'Pattern B (3x12_plus_4) requires either 12-hour or 4-hour shifts. Got % hours.', 
                    shift_duration;
            END IF;

            IF twelve_hour_shift_count > 3 THEN
                RAISE EXCEPTION 'Pattern B (3x12_plus_4) allows maximum 3 twelve-hour shifts. Found %.', 
                    twelve_hour_shift_count;
            END IF;

            IF four_hour_shift_count > 1 THEN
                RAISE EXCEPTION 'Pattern B (3x12_plus_4) allows only one 4-hour shift. Found %.', 
                    four_hour_shift_count;
            END IF;

            -- Check if shifts are consecutive
            IF last_shift_date IS NOT NULL AND 
               NEW.date - last_shift_date > interval '1 day' AND
               (twelve_hour_shift_count < 3 OR four_hour_shift_count = 0) THEN
                RAISE EXCEPTION 'Pattern B (3x12_plus_4) requires consecutive shifts. Gap found between % and %.', 
                    last_shift_date, NEW.date;
            END IF;

        ELSE
            RAISE EXCEPTION 'Unknown shift pattern: %', employee_pattern;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for shift pattern validation
CREATE TRIGGER enforce_shift_pattern
    BEFORE INSERT OR UPDATE ON individual_shifts
    FOR EACH ROW
    EXECUTE FUNCTION validate_shift_pattern();

-- Add helpful comments
COMMENT ON FUNCTION validate_shift_pattern() IS 'Validates that assigned shifts comply with employee shift patterns:
- Pattern A (4x10): Four consecutive 10-hour shifts
- Pattern B (3x12_plus_4): Three consecutive 12-hour shifts plus one 4-hour shift';

COMMENT ON FUNCTION calculate_shift_duration() IS 'Calculates shift duration in hours, handling overnight shifts correctly';

COMMIT;

-- Down Migration
BEGIN;

DROP TRIGGER IF EXISTS enforce_shift_pattern ON individual_shifts;
DROP FUNCTION IF EXISTS validate_shift_pattern();
DROP FUNCTION IF EXISTS calculate_shift_duration();
-- Don't drop the enum type as it might be used elsewhere

COMMIT; 