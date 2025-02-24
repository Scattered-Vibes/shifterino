-- Enhanced Pattern Validation Functions

-- Function to get an employee's shifts for a week
CREATE OR REPLACE FUNCTION get_employee_week_shifts(
    p_employee_id UUID,
    p_date DATE
) RETURNS TABLE (
    shift_date DATE,
    start_time TIME,
    end_time TIME,
    duration_hours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.date,
        s.start_time,
        s.end_time,
        calculate_hours_between(s.start_time, s.end_time)
    FROM shifts s
    JOIN shift_assignments sa ON s.id = sa.shift_id
    WHERE sa.user_id = p_employee_id
    AND s.date >= date_trunc('week', p_date)
    AND s.date < date_trunc('week', p_date) + INTERVAL '7 days'
    ORDER BY s.date, s.start_time;
END;
$$ LANGUAGE plpgsql;

-- Function to check if shifts are on consecutive days
CREATE OR REPLACE FUNCTION are_shifts_consecutive(
    p_employee_id UUID,
    p_date DATE
) RETURNS BOOLEAN AS $$
DECLARE
    v_prev_date DATE := NULL;
    v_shift_date DATE;
    v_consecutive_count INTEGER := 0;
    v_pattern shift_pattern;
    v_required_consecutive_days INTEGER;
BEGIN
    -- Get employee's pattern
    SELECT shift_pattern INTO v_pattern
    FROM employees
    WHERE id = p_employee_id;
    
    -- Both patterns require 4 consecutive days
    v_required_consecutive_days := 4;
    
    -- Check each shift date
    FOR v_shift_date IN 
        SELECT DISTINCT date
        FROM get_employee_week_shifts(p_employee_id, p_date)
        ORDER BY date
    LOOP
        IF v_prev_date IS NULL THEN
            v_consecutive_count := 1;
        ELSIF v_shift_date = v_prev_date + INTERVAL '1 day' THEN
            v_consecutive_count := v_consecutive_count + 1;
        ELSE
            v_consecutive_count := 1;
        END IF;
        
        v_prev_date := v_shift_date;
        
        -- If we've found enough consecutive days, we're good
        IF v_consecutive_count >= v_required_consecutive_days THEN
            RETURN TRUE;
        END IF;
    END LOOP;
    
    -- If we get here, we didn't find enough consecutive days
    RETURN v_consecutive_count >= v_required_consecutive_days;
END;
$$ LANGUAGE plpgsql;

-- Function to check if shifts follow the correct pattern
CREATE OR REPLACE FUNCTION validate_shift_pattern(
    p_employee_id UUID,
    p_date DATE
) RETURNS BOOLEAN AS $$
DECLARE
    v_pattern shift_pattern;
    v_shifts RECORD;
    v_pattern_hours NUMERIC[];
    v_current_hours NUMERIC[];
    v_day_count INTEGER := 0;
    v_found_pattern BOOLEAN := FALSE;
BEGIN
    -- Get employee's pattern
    SELECT shift_pattern INTO v_pattern
    FROM employees
    WHERE id = p_employee_id;
    
    -- Define pattern requirements
    IF v_pattern = 'pattern_a' THEN
        -- Pattern A: Four consecutive 10-hour shifts
        v_pattern_hours := ARRAY[10, 10, 10, 10];
    ELSE
        -- Pattern B: Three consecutive 12-hour shifts plus one 4-hour shift
        v_pattern_hours := ARRAY[12, 12, 12, 4];
    END IF;
    
    -- Initialize array for current week's hours
    v_current_hours := ARRAY[]::NUMERIC[];
    
    -- Get shifts for the week
    FOR v_shifts IN 
        SELECT * FROM get_employee_week_shifts(p_employee_id, p_date)
        ORDER BY shift_date, start_time
    LOOP
        -- Add hours to array
        v_current_hours := array_append(v_current_hours, v_shifts.duration_hours);
        v_day_count := v_day_count + 1;
        
        -- Check if we have enough days to match a pattern
        IF v_day_count = array_length(v_pattern_hours, 1) THEN
            -- For pattern_a, all shifts should be 10 hours
            IF v_pattern = 'pattern_a' THEN
                v_found_pattern := TRUE;
                FOR i IN 1..array_length(v_current_hours, 1) LOOP
                    IF v_current_hours[i] != 10 THEN
                        v_found_pattern := FALSE;
                    END IF;
                END LOOP;
            -- For pattern_b, should be three 12-hour shifts and one 4-hour shift
            ELSE
                IF array_length(v_current_hours, 1) = 4 THEN
                    -- Sort hours to match pattern (12,12,12,4)
                    SELECT array_agg(h ORDER BY h DESC)
                    INTO v_current_hours
                    FROM unnest(v_current_hours) h;
                    
                    v_found_pattern := TRUE;
                    FOR i IN 1..array_length(v_current_hours, 1) LOOP
                        IF v_current_hours[i] != v_pattern_hours[i] THEN
                            v_found_pattern := FALSE;
                        END IF;
                    END LOOP;
                END IF;
            END IF;
            
            -- If we found a valid pattern, we can return
            IF v_found_pattern THEN
                RETURN TRUE;
            END IF;
            
            -- Reset for next potential pattern
            v_current_hours := ARRAY[]::NUMERIC[];
            v_day_count := 0;
        END IF;
    END LOOP;
    
    -- If we get here, no valid pattern was found
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if shifts are at consistent times
CREATE OR REPLACE FUNCTION are_shifts_consistent_times(
    p_employee_id UUID,
    p_date DATE
) RETURNS BOOLEAN AS $$
DECLARE
    v_pattern shift_pattern;
    v_prev_start TIME := NULL;
    v_prev_end TIME := NULL;
    v_shifts RECORD;
    v_pattern_start TIME := NULL;
    v_pattern_end TIME := NULL;
    v_four_hour_shift_found BOOLEAN := FALSE;
BEGIN
    -- Get employee's pattern
    SELECT shift_pattern INTO v_pattern
    FROM employees
    WHERE id = p_employee_id;
    
    -- Check each shift
    FOR v_shifts IN 
        SELECT * FROM get_employee_week_shifts(p_employee_id, p_date)
        ORDER BY shift_date, start_time
    LOOP
        -- For pattern_b, we need to handle the 4-hour shift specially
        IF v_pattern = 'pattern_b' AND v_shifts.duration_hours = 4 THEN
            IF v_four_hour_shift_found THEN
                RETURN FALSE; -- Only one 4-hour shift allowed
            END IF;
            v_four_hour_shift_found := TRUE;
            CONTINUE; -- Skip time consistency check for 4-hour shift
        END IF;
        
        -- Store first shift times as pattern
        IF v_pattern_start IS NULL THEN
            v_pattern_start := v_shifts.start_time;
            v_pattern_end := v_shifts.end_time;
        -- Check subsequent shifts match the pattern
        ELSIF v_shifts.duration_hours != 4 AND (
            v_shifts.start_time != v_pattern_start OR 
            v_shifts.end_time != v_pattern_end
        ) THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update the main pattern validation function
CREATE OR REPLACE FUNCTION does_shift_match_pattern(
    p_employee_id UUID,
    p_shift_date DATE,
    p_shift_duration NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_week_hours NUMERIC;
BEGIN
    -- Check weekly hours
    SELECT COALESCE(SUM(duration_hours), 0)
    INTO v_current_week_hours
    FROM get_employee_week_shifts(p_employee_id, p_shift_date);
    
    -- Check if adding this shift would exceed 40 hours
    IF v_current_week_hours + p_shift_duration > 40 THEN
        RAISE EXCEPTION 'Shift would exceed 40 weekly hours (current: %, adding: %)',
            v_current_week_hours, p_shift_duration;
    END IF;
    
    -- Check consecutive days
    IF NOT are_shifts_consecutive(p_employee_id, p_shift_date) THEN
        RAISE EXCEPTION 'Shifts must be on consecutive days';
    END IF;
    
    -- Check pattern compliance
    IF NOT validate_shift_pattern(p_employee_id, p_shift_date) THEN
        RAISE EXCEPTION 'Shift does not match required pattern';
    END IF;
    
    -- Check consistent times
    IF NOT are_shifts_consistent_times(p_employee_id, p_shift_date) THEN
        RAISE EXCEPTION 'Shifts must be at consistent times';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION get_employee_week_shifts IS 'Gets all shifts for an employee in a given week';
COMMENT ON FUNCTION are_shifts_consecutive IS 'Checks if shifts are scheduled on consecutive days';
COMMENT ON FUNCTION validate_shift_pattern IS 'Validates that shifts follow the correct pattern (4x10 or 3x12+4)';
COMMENT ON FUNCTION are_shifts_consistent_times IS 'Checks if shifts are scheduled at consistent times';
COMMENT ON FUNCTION does_shift_match_pattern IS 'Main pattern validation function that checks all pattern requirements'; 