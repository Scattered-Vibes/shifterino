-- Schedule Validation Functions

-- Function to check if a time range crosses midnight
CREATE OR REPLACE FUNCTION does_time_range_cross_midnight(
    start_time TIME,
    end_time TIME
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN start_time > end_time;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if two time ranges overlap
CREATE OR REPLACE FUNCTION do_time_ranges_overlap(
    range1_start TIME,
    range1_end TIME,
    range2_start TIME,
    range2_end TIME
) RETURNS BOOLEAN AS $$
DECLARE
    r1_crosses_midnight BOOLEAN;
    r2_crosses_midnight BOOLEAN;
BEGIN
    r1_crosses_midnight := does_time_range_cross_midnight(range1_start, range1_end);
    r2_crosses_midnight := does_time_range_cross_midnight(range2_start, range2_end);
    
    -- If neither range crosses midnight, simple comparison
    IF NOT r1_crosses_midnight AND NOT r2_crosses_midnight THEN
        RETURN range1_start < range1_end 
            AND range2_start < range2_end 
            AND range1_start < range2_end 
            AND range2_start < range1_end;
    END IF;
    
    -- If range1 crosses midnight
    IF r1_crosses_midnight THEN
        RETURN range2_start >= range1_start OR range2_end <= range1_end;
    END IF;
    
    -- If range2 crosses midnight
    IF r2_crosses_midnight THEN
        RETURN range1_start >= range2_start OR range1_end <= range2_end;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate hours between two times, handling midnight crossing
CREATE OR REPLACE FUNCTION calculate_hours_between(
    start_time TIME,
    end_time TIME
) RETURNS NUMERIC AS $$
DECLARE
    hours NUMERIC;
BEGIN
    IF start_time <= end_time THEN
        hours := EXTRACT(EPOCH FROM (end_time - start_time)) / 3600;
    ELSE
        hours := EXTRACT(EPOCH FROM ('24:00:00'::TIME - start_time + end_time)) / 3600;
    END IF;
    RETURN hours;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if shifts match the correct pattern
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
    IF v_pattern = '4x10' THEN
        -- Pattern 4x10: Four consecutive 10-hour shifts
        v_pattern_hours := ARRAY[10, 10, 10, 10];
    ELSE
        -- Pattern 3x12_plus_4: Three consecutive 12-hour shifts plus one 4-hour shift
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
            -- For 4x10, all shifts should be 10 hours
            IF v_pattern = '4x10' THEN
                v_found_pattern := TRUE;
                FOR i IN 1..array_length(v_current_hours, 1) LOOP
                    IF v_current_hours[i] != 10 THEN
                        v_found_pattern := FALSE;
                    END IF;
                END LOOP;
            -- For 3x12_plus_4, should be three 12-hour shifts and one 4-hour shift
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

-- Update the main pattern validation function
CREATE OR REPLACE FUNCTION does_shift_match_pattern(
    p_employee_id UUID,
    p_shift_date DATE,
    p_shift_duration NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
    v_pattern shift_pattern;
    v_current_week_hours NUMERIC;
BEGIN
    -- Get employee's pattern
    SELECT shift_pattern INTO v_pattern
    FROM employees
    WHERE id = p_employee_id;
    
    -- Get current week's hours
    SELECT COALESCE(SUM(duration_hours), 0)
    INTO v_current_week_hours
    FROM get_employee_week_shifts(p_employee_id, p_shift_date);
    
    -- Check if adding this shift would exceed 40 hours
    IF v_current_week_hours + p_shift_duration > 40 THEN
        RAISE EXCEPTION 'Shift would exceed 40 weekly hours (current: %, adding: %)',
            v_current_week_hours, p_shift_duration;
    END IF;
    
    -- Validate pattern requirements
    CASE v_pattern
        WHEN '4x10' THEN
            IF p_shift_duration != 10 THEN
                RAISE EXCEPTION 'Shift duration must be 10 hours for 4x10 pattern';
            END IF;
        WHEN '3x12_plus_4' THEN
            IF p_shift_duration NOT IN (12, 4) THEN
                RAISE EXCEPTION 'Shift duration must be either 12 or 4 hours for 3x12_plus_4 pattern';
            END IF;
            -- Check if adding a 12-hour shift when already have 3
            IF p_shift_duration = 12 AND (
                SELECT COUNT(*)
                FROM get_employee_week_shifts(p_employee_id, p_shift_date)
                WHERE duration_hours = 12
            ) >= 3 THEN
                RAISE EXCEPTION 'Cannot add more than three 12-hour shifts in 3x12_plus_4 pattern';
            END IF;
            -- Check if adding a 4-hour shift when already have one
            IF p_shift_duration = 4 AND (
                SELECT COUNT(*)
                FROM get_employee_week_shifts(p_employee_id, p_shift_date)
                WHERE duration_hours = 4
            ) >= 1 THEN
                RAISE EXCEPTION 'Cannot add more than one 4-hour shift in 3x12_plus_4 pattern';
            END IF;
    END CASE;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to validate minimum staffing requirements
CREATE OR REPLACE FUNCTION validate_minimum_staffing(
    p_shift_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_shift_start TIME;
    v_shift_end TIME;
    v_shift_date DATE;
    v_staff_count INTEGER;
    v_supervisor_count INTEGER;
    v_req RECORD;
BEGIN
    -- Get shift details
    SELECT date, start_time, end_time
    INTO v_shift_date, v_shift_start, v_shift_end
    FROM shifts
    WHERE id = p_shift_id;
    
    -- For each staffing requirement that overlaps with this shift
    FOR v_req IN 
        SELECT sr.*
        FROM staffing_requirements sr
        WHERE do_time_ranges_overlap(
            v_shift_start, v_shift_end,
            sr.time_block_start, sr.time_block_end
        )
    LOOP
        -- Count total staff during this period
        SELECT 
            COUNT(DISTINCT sa.user_id),
            COUNT(DISTINCT CASE WHEN e.role = 'supervisor' THEN sa.user_id END)
        INTO v_staff_count, v_supervisor_count
        FROM shift_assignments sa
        JOIN shifts s ON sa.shift_id = s.id
        JOIN employees e ON sa.user_id = e.id
        WHERE s.date = v_shift_date
        AND do_time_ranges_overlap(
            s.start_time, s.end_time,
            v_req.time_block_start, v_req.time_block_end
        );
        
        -- Check if requirements are met
        IF v_staff_count < v_req.min_employees THEN
            RAISE EXCEPTION 'Insufficient staff during period % to %: need %, have %',
                v_req.time_block_start, v_req.time_block_end,
                v_req.min_employees, v_staff_count;
        END IF;
        
        IF v_req.requires_supervisor AND v_supervisor_count < 1 THEN
            RAISE EXCEPTION 'No supervisor available during period % to %',
                v_req.time_block_start, v_req.time_block_end;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to validate a shift assignment
CREATE OR REPLACE FUNCTION validate_shift_assignment()
RETURNS TRIGGER AS $$
DECLARE
    v_shift_duration NUMERIC;
    v_overlapping_count INTEGER;
BEGIN
    -- Get shift duration
    SELECT calculate_hours_between(start_time, end_time)
    INTO v_shift_duration
    FROM shifts
    WHERE id = NEW.shift_id;
    
    -- Check for overlapping shifts
    SELECT COUNT(*)
    INTO v_overlapping_count
    FROM shift_assignments sa
    JOIN shifts s1 ON sa.shift_id = s1.id
    JOIN shifts s2 ON NEW.shift_id = s2.id
    WHERE sa.user_id = NEW.user_id
    AND s1.date = s2.date
    AND do_time_ranges_overlap(
        s1.start_time, s1.end_time,
        s2.start_time, s2.end_time
    );
    
    IF v_overlapping_count > 0 THEN
        RAISE EXCEPTION 'Employee already has an overlapping shift';
    END IF;
    
    -- Validate shift pattern
    IF NOT does_shift_match_pattern(NEW.user_id, (SELECT date FROM shifts WHERE id = NEW.shift_id), v_shift_duration) THEN
        RAISE EXCEPTION 'Shift does not match employee pattern or exceeds weekly hours';
    END IF;
    
    -- Validate minimum staffing requirements
    PERFORM validate_minimum_staffing(NEW.shift_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for shift assignment validation
DROP TRIGGER IF EXISTS validate_shift_assignment_trigger ON shift_assignments;
CREATE TRIGGER validate_shift_assignment_trigger
    BEFORE INSERT OR UPDATE ON shift_assignments
    FOR EACH ROW
    EXECUTE FUNCTION validate_shift_assignment();

-- Function to validate an entire schedule
DROP FUNCTION IF EXISTS validate_schedule(UUID);

CREATE OR REPLACE FUNCTION validate_schedule(
    p_schedule_id UUID
) RETURNS TABLE (
    valid BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_shift RECORD;
    v_error TEXT;
BEGIN
    -- Check each shift in the schedule
    FOR v_shift IN 
        SELECT s.id
        FROM shifts s
        WHERE s.schedule_id = p_schedule_id
    LOOP
        BEGIN
            -- Validate minimum staffing for this shift
            PERFORM validate_minimum_staffing(v_shift.id);
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT FALSE, SQLERRM;
            RETURN;
        END;
    END LOOP;
    
    -- If we get here, all validations passed
    RETURN QUERY SELECT TRUE, NULL::TEXT;
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to check time off conflicts
CREATE OR REPLACE FUNCTION check_time_off_conflicts(
    p_employee_id UUID,
    p_shift_date DATE
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1
        FROM time_off_requests
        WHERE user_id = p_employee_id
        AND p_shift_date BETWEEN start_date AND end_date
        AND status = 'APPROVED'
    );
END;
$$ LANGUAGE plpgsql;

-- Add time off check to shift assignment validation
CREATE OR REPLACE FUNCTION validate_shift_assignment_with_time_off()
RETURNS TRIGGER AS $$
DECLARE
    v_shift_date DATE;
BEGIN
    -- Get shift date
    SELECT date INTO v_shift_date
    FROM shifts
    WHERE id = NEW.shift_id;
    
    -- Check for time off conflicts
    IF NOT check_time_off_conflicts(NEW.user_id, v_shift_date) THEN
        RAISE EXCEPTION 'Employee has approved time off for this date';
    END IF;
    
    -- Call the main validation function
    RETURN validate_shift_assignment();
END;
$$ LANGUAGE plpgsql;

-- Update the trigger to use the new function
DROP TRIGGER IF EXISTS validate_shift_assignment_trigger ON shift_assignments;
CREATE TRIGGER validate_shift_assignment_trigger
    BEFORE INSERT OR UPDATE ON shift_assignments
    FOR EACH ROW
    EXECUTE FUNCTION validate_shift_assignment_with_time_off();

-- Add comments
COMMENT ON FUNCTION does_time_range_cross_midnight IS 'Checks if a time range crosses midnight';
COMMENT ON FUNCTION do_time_ranges_overlap IS 'Checks if two time ranges overlap, handling midnight crossing';
COMMENT ON FUNCTION calculate_hours_between IS 'Calculates hours between two times, handling midnight crossing';
COMMENT ON FUNCTION validate_shift_pattern IS 'Checks if shifts match the correct pattern';
COMMENT ON FUNCTION does_shift_match_pattern IS 'Checks if a shift matches the employee''s assigned pattern';
COMMENT ON FUNCTION validate_minimum_staffing IS 'Validates minimum staffing requirements for a shift';
COMMENT ON FUNCTION validate_shift_assignment IS 'Validates a shift assignment against all constraints';
COMMENT ON FUNCTION validate_schedule IS 'Validates an entire schedule against all constraints';
COMMENT ON FUNCTION check_time_off_conflicts IS 'Checks for conflicts with approved time off requests'; 