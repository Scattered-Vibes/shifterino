-- Schedule Generation and Optimization Functions

-- Type for shift score calculation
CREATE TYPE shift_score AS (
    employee_id UUID,
    shift_option_id UUID,
    score NUMERIC,
    reason TEXT
);

-- Function to calculate shift preference score
CREATE OR REPLACE FUNCTION calculate_shift_preference_score(
    p_employee_id UUID,
    p_shift_option_id UUID,
    p_date DATE
) RETURNS shift_score AS $$
DECLARE
    v_score NUMERIC := 0;
    v_reason TEXT := '';
    v_shift_category shift_category;
    v_employee_record RECORD;
    v_shift_option RECORD;
BEGIN
    -- Get employee details
    SELECT * INTO v_employee_record
    FROM employees
    WHERE id = p_employee_id;
    
    -- Get shift option details
    SELECT * INTO v_shift_option
    FROM shift_options
    WHERE id = p_shift_option_id;
    
    -- Base score starts at 100
    v_score := 100;
    
    -- Check if shift matches employee's preferred category
    IF v_shift_option.category = v_employee_record.preferred_shift_category THEN
        v_score := v_score + 20;
        v_reason := v_reason || 'Preferred shift category (+20). ';
    END IF;
    
    -- Check if employee has worked similar shifts recently (consistency bonus)
    IF EXISTS (
        SELECT 1
        FROM shifts s
        JOIN shift_assignments sa ON s.id = sa.shift_id
        WHERE sa.user_id = p_employee_id
        AND s.date BETWEEN p_date - INTERVAL '7 days' AND p_date - INTERVAL '1 day'
        AND s.shift_category = v_shift_option.category
    ) THEN
        v_score := v_score + 10;
        v_reason := v_reason || 'Consistent with recent shifts (+10). ';
    END IF;
    
    -- Check for pending time off requests (heavy penalty)
    IF EXISTS (
        SELECT 1
        FROM time_off_requests
        WHERE user_id = p_employee_id
        AND p_date BETWEEN start_date AND end_date
        AND status = 'PENDING'
    ) THEN
        v_score := v_score - 50;
        v_reason := v_reason || 'Pending time off request (-50). ';
    END IF;
    
    -- Check weekly hours to avoid overtime
    SELECT COALESCE(SUM(
        calculate_hours_between(s.start_time, s.end_time)
    ), 0)
    INTO v_score
    FROM shifts s
    JOIN shift_assignments sa ON s.id = sa.shift_id
    WHERE sa.user_id = p_employee_id
    AND s.date >= date_trunc('week', p_date)
    AND s.date < date_trunc('week', p_date) + INTERVAL '7 days';
    
    IF v_score > 32 THEN -- Approaching overtime
        v_score := v_score - 30;
        v_reason := v_reason || 'Close to overtime (-30). ';
    END IF;
    
    RETURN (p_employee_id, p_shift_option_id, v_score, v_reason)::shift_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get available employees for a shift
CREATE OR REPLACE FUNCTION get_available_employees(
    p_shift_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_require_supervisor BOOLEAN DEFAULT false
) RETURNS TABLE (
    employee_id UUID,
    role employee_role,
    shift_pattern shift_pattern
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.role,
        e.shift_pattern
    FROM employees e
    WHERE 
        -- Not on approved time off
        NOT EXISTS (
            SELECT 1
            FROM time_off_requests tor
            WHERE tor.user_id = e.id
            AND p_shift_date BETWEEN tor.start_date AND tor.end_date
            AND tor.status = 'APPROVED'
        )
        -- Not already assigned to an overlapping shift
        AND NOT EXISTS (
            SELECT 1
            FROM shifts s
            JOIN shift_assignments sa ON s.id = sa.shift_id
            WHERE sa.user_id = e.id
            AND s.date = p_shift_date
            AND do_time_ranges_overlap(
                s.start_time, s.end_time,
                p_start_time, p_end_time
            )
        )
        -- If supervisor required, only get supervisors
        AND (
            NOT p_require_supervisor 
            OR e.role IN ('supervisor', 'manager')
        );
END;
$$ LANGUAGE plpgsql;

-- Function to generate a schedule for a period
CREATE OR REPLACE FUNCTION generate_schedule(
    p_start_date DATE,
    p_end_date DATE,
    p_organization_id UUID
) RETURNS UUID AS $$
DECLARE
    v_schedule_id UUID;
    v_current_date DATE;
    v_req RECORD;
    v_shift_id UUID;
    v_available_employee RECORD;
    v_best_score shift_score;
    v_shift_option RECORD;
BEGIN
    -- Create new schedule
    INSERT INTO schedules (
        organization_id,
        start_date,
        end_date,
        is_published
    ) VALUES (
        p_organization_id,
        p_start_date,
        p_end_date,
        false
    ) RETURNING id INTO v_schedule_id;
    
    -- For each date in the period
    v_current_date := p_start_date;
    WHILE v_current_date <= p_end_date LOOP
        -- For each staffing requirement
        FOR v_req IN 
            SELECT *
            FROM staffing_requirements
            ORDER BY time_block_start
        LOOP
            -- Find appropriate shift options
            FOR v_shift_option IN
                SELECT *
                FROM shift_options
                WHERE category = (
                    CASE 
                        WHEN v_req.time_block_start BETWEEN '05:00' AND '09:00' THEN 'early'
                        WHEN v_req.time_block_start BETWEEN '09:00' AND '17:00' THEN 'day'
                        WHEN v_req.time_block_start BETWEEN '17:00' AND '21:00' THEN 'swing'
                        ELSE 'graveyard'
                    END
                )::shift_category
            LOOP
                -- Create shift
                INSERT INTO shifts (
                    schedule_id,
                    date,
                    start_time,
                    end_time,
                    shift_category,
                    shift_option_id
                ) VALUES (
                    v_schedule_id,
                    v_current_date,
                    v_shift_option.start_time,
                    v_shift_option.end_time,
                    v_shift_option.category,
                    v_shift_option.id
                ) RETURNING id INTO v_shift_id;
                
                -- Assign employees to meet minimum requirements
                FOR i IN 1..v_req.min_employees LOOP
                    -- First, ensure supervisor coverage if needed
                    IF v_req.requires_supervisor AND i = 1 THEN
                        -- Get available supervisors
                        FOR v_available_employee IN
                            SELECT *
                            FROM get_available_employees(
                                v_current_date,
                                v_shift_option.start_time,
                                v_shift_option.end_time,
                                true
                            )
                        LOOP
                            SELECT *
                            INTO v_best_score
                            FROM calculate_shift_preference_score(
                                v_available_employee.employee_id,
                                v_shift_option.id,
                                v_current_date
                            );
                            
                            IF v_best_score.score >= 0 THEN
                                INSERT INTO shift_assignments (
                                    shift_id,
                                    user_id,
                                    status
                                ) VALUES (
                                    v_shift_id,
                                    v_best_score.employee_id,
                                    'ASSIGNED'
                                );
                                EXIT;
                            END IF;
                        END LOOP;
                    ELSE
                        -- Get available regular employees
                        FOR v_available_employee IN
                            SELECT *
                            FROM get_available_employees(
                                v_current_date,
                                v_shift_option.start_time,
                                v_shift_option.end_time,
                                false
                            )
                        LOOP
                            SELECT *
                            INTO v_best_score
                            FROM calculate_shift_preference_score(
                                v_available_employee.employee_id,
                                v_shift_option.id,
                                v_current_date
                            );
                            
                            IF v_best_score.score >= 0 THEN
                                INSERT INTO shift_assignments (
                                    shift_id,
                                    user_id,
                                    status
                                ) VALUES (
                                    v_shift_id,
                                    v_best_score.employee_id,
                                    'ASSIGNED'
                                );
                                EXIT;
                            END IF;
                        END LOOP;
                    END IF;
                END LOOP;
            END LOOP;
        END LOOP;
        
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
    
    RETURN v_schedule_id;
END;
$$ LANGUAGE plpgsql;

-- Function to optimize an existing schedule
CREATE OR REPLACE FUNCTION optimize_schedule(
    p_schedule_id UUID
) RETURNS TABLE (
    changes_made INTEGER,
    improvement_score NUMERIC
) AS $$
DECLARE
    v_changes INTEGER := 0;
    v_score_before NUMERIC;
    v_score_after NUMERIC;
    v_shift RECORD;
    v_current_assignment RECORD;
    v_potential_employee RECORD;
    v_current_score shift_score;
    v_potential_score shift_score;
BEGIN
    -- Calculate initial schedule score
    SELECT COALESCE(SUM(
        (SELECT score FROM calculate_shift_preference_score(sa.user_id, s.shift_option_id, s.date))
    ), 0)
    INTO v_score_before
    FROM shifts s
    JOIN shift_assignments sa ON s.id = sa.shift_id
    WHERE s.schedule_id = p_schedule_id;
    
    -- Look for potential improvements
    FOR v_shift IN
        SELECT s.*, sr.requires_supervisor, sr.min_employees
        FROM shifts s
        JOIN staffing_requirements sr ON do_time_ranges_overlap(
            s.start_time, s.end_time,
            sr.time_block_start, sr.time_block_end
        )
        WHERE s.schedule_id = p_schedule_id
    LOOP
        -- Check each current assignment
        FOR v_current_assignment IN
            SELECT sa.*
            FROM shift_assignments sa
            WHERE sa.shift_id = v_shift.id
        LOOP
            -- Get current assignment score
            SELECT *
            INTO v_current_score
            FROM calculate_shift_preference_score(
                v_current_assignment.user_id,
                v_shift.shift_option_id,
                v_shift.date
            );
            
            -- Look for better assignments
            FOR v_potential_employee IN
                SELECT *
                FROM get_available_employees(
                    v_shift.date,
                    v_shift.start_time,
                    v_shift.end_time,
                    v_shift.requires_supervisor
                )
                WHERE id != v_current_assignment.user_id
            LOOP
                -- Calculate potential score
                SELECT *
                INTO v_potential_score
                FROM calculate_shift_preference_score(
                    v_potential_employee.employee_id,
                    v_shift.shift_option_id,
                    v_shift.date
                );
                
                -- If potential assignment is better, swap
                IF v_potential_score.score > v_current_score.score + 10 THEN -- Require significant improvement
                    UPDATE shift_assignments
                    SET user_id = v_potential_employee.employee_id
                    WHERE id = v_current_assignment.id;
                    
                    v_changes := v_changes + 1;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
    
    -- Calculate final schedule score
    SELECT COALESCE(SUM(
        (SELECT score FROM calculate_shift_preference_score(sa.user_id, s.shift_option_id, s.date))
    ), 0)
    INTO v_score_after
    FROM shifts s
    JOIN shift_assignments sa ON s.id = sa.shift_id
    WHERE s.schedule_id = p_schedule_id;
    
    RETURN QUERY
    SELECT v_changes, v_score_after - v_score_before;
END;
$$ LANGUAGE plpgsql;

-- Function to handle schedule transitions
CREATE OR REPLACE FUNCTION handle_schedule_transition(
    p_old_schedule_id UUID,
    p_new_schedule_id UUID
) RETURNS VOID AS $$
DECLARE
    v_overlap_start DATE;
    v_overlap_end DATE;
    v_shift RECORD;
BEGIN
    -- Find overlap period
    SELECT 
        GREATEST(s1.start_date, s2.start_date - INTERVAL '7 days'),
        LEAST(s1.end_date + INTERVAL '7 days', s2.end_date)
    INTO v_overlap_start, v_overlap_end
    FROM schedules s1, schedules s2
    WHERE s1.id = p_old_schedule_id
    AND s2.id = p_new_schedule_id;
    
    -- Copy relevant shift assignments from old schedule to new
    FOR v_shift IN
        SELECT s.*, sa.user_id
        FROM shifts s
        JOIN shift_assignments sa ON s.id = sa.shift_id
        WHERE s.schedule_id = p_old_schedule_id
        AND s.date BETWEEN v_overlap_start AND v_overlap_end
    LOOP
        -- Create corresponding shift in new schedule
        INSERT INTO shifts (
            schedule_id,
            date,
            start_time,
            end_time,
            shift_category,
            shift_option_id
        ) VALUES (
            p_new_schedule_id,
            v_shift.date,
            v_shift.start_time,
            v_shift.end_time,
            v_shift.shift_category,
            v_shift.shift_option_id
        );
        
        -- Copy assignment
        INSERT INTO shift_assignments (
            shift_id,
            user_id,
            status
        ) VALUES (
            currval('shifts_id_seq'),
            v_shift.user_id,
            'ASSIGNED'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION calculate_shift_preference_score IS 'Calculates a score for how well a shift matches an employee''s preferences';
COMMENT ON FUNCTION get_available_employees IS 'Gets employees available for a specific shift time';
COMMENT ON FUNCTION generate_schedule(DATE, DATE, UUID) IS 'Generates a complete schedule for a given period';
COMMENT ON FUNCTION optimize_schedule IS 'Attempts to optimize an existing schedule by swapping assignments';
COMMENT ON FUNCTION handle_schedule_transition IS 'Handles the transition between two schedule periods'; 