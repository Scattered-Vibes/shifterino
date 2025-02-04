--
-- Scheduling Functions Migration
-- Contains all scheduling-related functions and procedures
--

-- Helper Functions

-- Function to calculate consecutive shifts
CREATE OR REPLACE FUNCTION calculate_consecutive_shifts(
    p_employee_id UUID,
    p_date DATE
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_consecutive INTEGER;
    v_start_date DATE;
BEGIN
    -- Get the most recent completed shift date
    SELECT date
    INTO v_start_date
    FROM individual_shifts
    WHERE employee_id = p_employee_id
    AND date < p_date
    AND status = 'completed'
    ORDER BY date DESC
    LIMIT 1;

    -- If no previous shifts, return 0
    IF v_start_date IS NULL THEN
        RETURN 0;
    END IF;

    WITH RECURSIVE shift_chain(shift_date, consecutive_count) AS (
        -- Base case: start with the most recent shift
        SELECT v_start_date, 1
        UNION ALL
        -- Recursive case: look for previous consecutive days
        SELECT 
            (s.date)::date,
            sc.consecutive_count + 1
        FROM shift_chain sc
        JOIN individual_shifts s ON s.date = sc.shift_date - interval '1 day'
        WHERE s.employee_id = p_employee_id
        AND s.status = 'completed'
    )
    SELECT COALESCE(MAX(consecutive_count), 0)
    INTO v_consecutive
    FROM shift_chain;

    RETURN v_consecutive;
END;
$$;

-- Function to calculate weekly hours
CREATE OR REPLACE FUNCTION calculate_weekly_hours(
    p_employee_id UUID,
    p_start_date DATE
) RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_hours DECIMAL;
BEGIN
    SELECT COALESCE(SUM(actual_hours_worked), 0)
    INTO v_total_hours
    FROM individual_shifts
    WHERE employee_id = p_employee_id
    AND date >= p_start_date
    AND date < p_start_date + INTERVAL '7 days'
    AND status IN ('completed', 'scheduled');

    RETURN v_total_hours;
END;
$$;

-- Validation Functions

CREATE OR REPLACE FUNCTION validate_shift_pattern(
    p_employee_id UUID,
    p_shift_date DATE,
    p_shift_duration INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_pattern shift_pattern;
    v_consecutive INTEGER;
    v_weekly_hours DECIMAL;
    v_pattern_rule RECORD;
BEGIN
    -- Get employee's shift pattern
    SELECT shift_pattern, weekly_hours_cap
    INTO v_pattern, v_weekly_hours
    FROM employees
    WHERE id = p_employee_id;

    -- Get pattern rules
    SELECT *
    INTO v_pattern_rule
    FROM shift_pattern_rules
    WHERE pattern = v_pattern;

    -- Check consecutive shifts
    v_consecutive := calculate_consecutive_shifts(p_employee_id, p_shift_date);
    
    -- Validate against pattern rules
    IF v_consecutive >= v_pattern_rule.consecutive_shifts THEN
        RETURN FALSE;
    END IF;

    -- Validate shift duration against pattern
    IF NOT (p_shift_duration = ANY(v_pattern_rule.shift_durations)) THEN
        RETURN FALSE;
    END IF;

    -- Check weekly hours
    IF calculate_weekly_hours(p_employee_id, p_shift_date) + p_shift_duration > v_weekly_hours THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_staffing_requirements(
    p_date DATE,
    p_time_block_start TIME,
    p_time_block_end TIME
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_staff INTEGER;
    v_current_supervisors INTEGER;
    v_required RECORD;
BEGIN
    -- Get staffing requirements
    SELECT min_total_staff, min_supervisors
    INTO v_required
    FROM staffing_requirements
    WHERE time_block_start = p_time_block_start
    AND time_block_end = p_time_block_end
    AND (schedule_period_id IS NULL OR 
         schedule_period_id IN (
             SELECT id FROM schedule_periods 
             WHERE start_date <= p_date AND end_date >= p_date
         ));

    -- Count current staff
    SELECT 
        COUNT(*) as total_staff,
        SUM(CASE WHEN e.role = 'supervisor' THEN 1 ELSE 0 END) as supervisor_count
    INTO v_current_staff, v_current_supervisors
    FROM individual_shifts s
    JOIN employees e ON e.id = s.employee_id
    JOIN shift_options so ON so.id = s.shift_option_id
    WHERE s.date = p_date
    AND s.status = 'scheduled'
    AND so.start_time <= p_time_block_start
    AND so.end_time >= p_time_block_end;

    RETURN v_current_staff >= v_required.min_total_staff 
        AND v_current_supervisors >= v_required.min_supervisors;
END;
$$ LANGUAGE plpgsql;

-- Scoring Functions

CREATE OR REPLACE FUNCTION calculate_shift_score(
    p_employee_id UUID,
    p_shift_option_id UUID,
    p_date DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
    v_employee RECORD;
    v_shift RECORD;
    v_consecutive INTEGER;
    v_weekly_hours DECIMAL;
BEGIN
    -- Get employee and shift details
    SELECT * INTO v_employee FROM employees WHERE id = p_employee_id;
    SELECT * INTO v_shift FROM shift_options WHERE id = p_shift_option_id;

    -- Preference score (0-40 points)
    IF v_employee.preferred_shift_category = v_shift.category THEN
        v_score := v_score + 40;
    END IF;

    -- Fatigue score (0-30 points)
    v_consecutive := calculate_consecutive_shifts(p_employee_id, p_date);
    v_score := v_score + (30 - (v_consecutive * 5));

    -- Weekly hours balance score (0-30 points)
    v_weekly_hours := calculate_weekly_hours(p_employee_id, p_date);
    v_score := v_score + (30 - (v_weekly_hours::INTEGER / 2));

    -- Normalize score to 0-100 range
    RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql;

-- Schedule Generation Functions

CREATE OR REPLACE FUNCTION generate_schedule_for_period(
    p_period_id UUID
)
RETURNS TABLE (
    employee_id UUID,
    shift_id UUID,
    score INTEGER
) AS $$
DECLARE
    v_period RECORD;
    v_current_date DATE;
    v_shift RECORD;
    v_employee RECORD;
    v_score INTEGER;
BEGIN
    -- Get period details
    SELECT * INTO v_period FROM schedule_periods WHERE id = p_period_id;
    
    -- For each date in the period
    v_current_date := v_period.start_date;
    WHILE v_current_date <= v_period.end_date LOOP
        -- For each shift option
        FOR v_shift IN 
            SELECT * FROM shift_options 
            ORDER BY start_time
        LOOP
            -- For each available employee
            FOR v_employee IN 
                SELECT e.* 
                FROM employees e
                WHERE NOT EXISTS (
                    -- Exclude employees with time off
                    SELECT 1 FROM time_off_requests t
                    WHERE t.employee_id = e.id
                    AND t.start_date <= v_current_date
                    AND t.end_date >= v_current_date
                    AND t.status = 'approved'
                )
                AND NOT EXISTS (
                    -- Exclude employees already scheduled
                    SELECT 1 FROM individual_shifts s
                    WHERE s.employee_id = e.id
                    AND s.date = v_current_date
                )
                ORDER BY e.role DESC -- Supervisors first
            LOOP
                -- Validate shift pattern
                IF validate_shift_pattern(
                    v_employee.id, 
                    v_current_date, 
                    v_shift.duration_hours
                ) THEN
                    -- Calculate score
                    v_score := calculate_shift_score(
                        v_employee.id,
                        v_shift.id,
                        v_current_date
                    );
                    
                    -- Return valid assignment
                    employee_id := v_employee.id;
                    shift_id := v_shift.id;
                    score := v_score;
                    RETURN NEXT;
                END IF;
            END LOOP;
        END LOOP;
        
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Notification and Logging Functions

CREATE OR REPLACE FUNCTION log_scheduling_event(
    p_period_id UUID,
    p_message TEXT,
    p_severity log_severity,
    p_employee_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO scheduling_logs (
        schedule_period_id,
        log_message,
        severity,
        related_employee_id
    ) VALUES (
        p_period_id,
        p_message,
        p_severity,
        p_employee_id
    );
END;
$$ LANGUAGE plpgsql;

-- Shift Swap Functions

CREATE OR REPLACE FUNCTION process_shift_swap(
    p_swap_request_id UUID,
    p_approved BOOLEAN,
    p_approver_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_request RECORD;
BEGIN
    -- Get swap request details
    SELECT * INTO v_request 
    FROM shift_swap_requests 
    WHERE id = p_swap_request_id;

    -- Validate approver is a supervisor
    IF NOT EXISTS (
        SELECT 1 FROM employees 
        WHERE id = p_approver_id 
        AND role IN ('supervisor', 'manager')
    ) THEN
        RAISE EXCEPTION 'Unauthorized approval attempt';
    END IF;

    -- Process approval
    IF p_approved THEN
        -- Update shift assignments
        UPDATE individual_shifts
        SET employee_id = v_request.requested_employee_id
        WHERE id = v_request.shift_id;

        IF v_request.proposed_shift_id IS NOT NULL THEN
            UPDATE individual_shifts
            SET employee_id = v_request.requester_id
            WHERE id = v_request.proposed_shift_id;
        END IF;

        -- Update request status
        UPDATE shift_swap_requests
        SET status = 'approved'
        WHERE id = p_swap_request_id;

        -- Log the swap
        PERFORM log_scheduling_event(
            (SELECT schedule_period_id FROM individual_shifts WHERE id = v_request.shift_id),
            'Shift swap approved between employees',
            'info'::log_severity,
            v_request.requester_id
        );
    ELSE
        -- Update request status
        UPDATE shift_swap_requests
        SET status = 'rejected'
        WHERE id = p_swap_request_id;

        -- Log the rejection
        PERFORM log_scheduling_event(
            (SELECT schedule_period_id FROM individual_shifts WHERE id = v_request.shift_id),
            'Shift swap rejected',
            'info'::log_severity,
            v_request.requester_id
        );
    END IF;

    RETURN TRUE;

EXCEPTION WHEN OTHERS THEN
    -- Log error
    PERFORM log_scheduling_event(
        (SELECT schedule_period_id FROM individual_shifts WHERE id = v_request.shift_id),
        'Error processing shift swap: ' || SQLERRM,
        'error'::log_severity,
        v_request.requester_id
    );
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for logging schedule changes

CREATE OR REPLACE FUNCTION log_schedule_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_scheduling_event(
            NEW.schedule_period_id,
            'New shift assigned to employee',
            'info'::log_severity,
            NEW.employee_id
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.employee_id != NEW.employee_id THEN
            PERFORM log_scheduling_event(
                NEW.schedule_period_id,
                'Shift reassigned to different employee',
                'info'::log_severity,
                NEW.employee_id
            );
        ELSIF OLD.status != NEW.status THEN
            PERFORM log_scheduling_event(
                NEW.schedule_period_id,
                'Shift status changed from ' || OLD.status || ' to ' || NEW.status,
                'info'::log_severity,
                NEW.employee_id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_schedule_changes_trigger
    AFTER INSERT OR UPDATE ON individual_shifts
    FOR EACH ROW
    EXECUTE FUNCTION log_schedule_changes();

-- Grant permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Additional Schedule Validation Functions

CREATE OR REPLACE FUNCTION validate_shift_pattern()
RETURNS TRIGGER AS $$
DECLARE
    employee_pattern shift_pattern;
    consecutive_shifts INTEGER;
    total_hours DECIMAL;
    pattern_valid BOOLEAN := false;
BEGIN
    -- Get employee's shift pattern
    SELECT shift_pattern INTO employee_pattern
    FROM employees
    WHERE id = NEW.employee_id;
    
    -- Calculate consecutive shifts
    consecutive_shifts := calculate_consecutive_shifts(NEW.employee_id, NEW.date);
    
    -- Calculate total hours in the pattern
    SELECT COALESCE(SUM(actual_hours_worked), 0)
    INTO total_hours
    FROM individual_shifts
    WHERE employee_id = NEW.employee_id
    AND date >= NEW.date - INTERVAL '7 days'
    AND date <= NEW.date;
    
    -- Validate pattern A (4x10)
    IF employee_pattern = 'pattern_a' THEN
        pattern_valid := (
            consecutive_shifts <= 4 AND
            total_hours <= 40
        );
    -- Validate pattern B (3x12 + 1x4)
    ELSIF employee_pattern = 'pattern_b' THEN
        pattern_valid := (
            consecutive_shifts <= 4 AND
            total_hours <= 40
        );
    -- Custom patterns are always valid (managed by business logic)
    ELSIF employee_pattern = 'custom' THEN
        pattern_valid := true;
    END IF;
    
    IF NOT pattern_valid THEN
        RAISE EXCEPTION 'Shift pattern violation for employee %', NEW.employee_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to detect schedule conflicts
CREATE OR REPLACE FUNCTION detect_schedule_conflicts(
    p_employee_id UUID,
    p_shift_date DATE,
    p_start_time TIME,
    p_end_time TIME
)
RETURNS TEXT AS $$
DECLARE
    conflict_message TEXT := NULL;
BEGIN
    -- Check for overlapping shifts
    IF EXISTS (
        SELECT 1
        FROM individual_shifts i
        JOIN shift_options s ON s.id = i.shift_option_id
        WHERE i.employee_id = p_employee_id
        AND i.date = p_shift_date
        AND (
            (p_start_time, p_end_time) OVERLAPS (s.start_time, s.end_time)
        )
    ) THEN
        conflict_message := 'Overlapping shift detected';
    END IF;
    
    -- Check for minimum rest period
    IF EXISTS (
        SELECT 1
        FROM individual_shifts i
        JOIN shift_options s ON s.id = i.shift_option_id
        WHERE i.employee_id = p_employee_id
        AND i.date = p_shift_date - INTERVAL '1 day'
        AND s.end_time + INTERVAL '8 hours' > p_start_time
    ) THEN
        conflict_message := COALESCE(conflict_message || '; ', '') || 'Insufficient rest period';
    END IF;
    
    -- Check weekly hours limit
    IF (
        SELECT SUM(s.duration_hours)
        FROM individual_shifts i
        JOIN shift_options s ON s.id = i.shift_option_id
        WHERE i.employee_id = p_employee_id
        AND i.date >= p_shift_date - INTERVAL '6 days'
        AND i.date <= p_shift_date
    ) > 40 THEN
        conflict_message := COALESCE(conflict_message || '; ', '') || 'Weekly hours limit exceeded';
    END IF;
    
    RETURN conflict_message;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for pattern validation
CREATE TRIGGER validate_shift_pattern_trigger
    BEFORE INSERT OR UPDATE ON individual_shifts
    FOR EACH ROW
    EXECUTE FUNCTION validate_shift_pattern();

-- Function to update employee statistics
CREATE OR REPLACE FUNCTION update_employee_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update employee's last shift date and statistics
    UPDATE employees
    SET last_shift_date = NEW.date,
        consecutive_shifts_count = calculate_consecutive_shifts(NEW.employee_id, NEW.date),
        total_hours_current_week = (
            SELECT COALESCE(SUM(actual_hours_worked), 0)
            FROM individual_shifts
            WHERE employee_id = NEW.employee_id
            AND date >= NEW.date - INTERVAL '6 days'
            AND date <= NEW.date
        )
    WHERE id = NEW.employee_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for employee statistics updates
CREATE TRIGGER update_employee_stats_trigger
    AFTER INSERT OR UPDATE ON individual_shifts
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_statistics(); 