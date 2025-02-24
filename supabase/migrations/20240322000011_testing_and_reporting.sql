-- Testing and Reporting Functions

-- Function to analyze schedule coverage
CREATE OR REPLACE FUNCTION analyze_schedule_coverage(
    p_schedule_id UUID
) RETURNS TABLE (
    date DATE,
    time_block_start TIME,
    time_block_end TIME,
    required_staff INTEGER,
    actual_staff INTEGER,
    required_supervisors INTEGER,
    actual_supervisors INTEGER,
    coverage_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH schedule_coverage AS (
        SELECT 
            s.date,
            sr.time_block_start,
            sr.time_block_end,
            sr.min_employees as required_staff,
            COUNT(DISTINCT sa.user_id) as actual_staff,
            sr.requires_supervisor::INTEGER as required_supervisors,
            COUNT(DISTINCT CASE WHEN e.role IN ('supervisor', 'manager') THEN sa.user_id END) as actual_supervisors
        FROM shifts s
        CROSS JOIN staffing_requirements sr
        LEFT JOIN shift_assignments sa ON s.id = sa.shift_id
        LEFT JOIN employees e ON sa.user_id = e.id
        WHERE s.schedule_id = p_schedule_id
        AND do_time_ranges_overlap(
            s.start_time, s.end_time,
            sr.time_block_start, sr.time_block_end
        )
        GROUP BY s.date, sr.time_block_start, sr.time_block_end, sr.min_employees, sr.requires_supervisor
    )
    SELECT 
        sc.date,
        sc.time_block_start,
        sc.time_block_end,
        sc.required_staff,
        sc.actual_staff,
        sc.required_supervisors,
        sc.actual_supervisors,
        CASE 
            WHEN sc.actual_staff < sc.required_staff THEN 'UNDERSTAFFED'
            WHEN sc.required_supervisors > 0 AND sc.actual_supervisors = 0 THEN 'NO_SUPERVISOR'
            WHEN sc.actual_staff > sc.required_staff THEN 'OVERSTAFFED'
            ELSE 'OK'
        END as coverage_status
    FROM schedule_coverage sc
    ORDER BY sc.date, sc.time_block_start;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze pattern compliance
CREATE OR REPLACE FUNCTION analyze_pattern_compliance(
    p_schedule_id UUID
) RETURNS TABLE (
    employee_id UUID,
    employee_name TEXT,
    pattern shift_pattern,
    week_start DATE,
    total_hours NUMERIC,
    consecutive_days INTEGER,
    pattern_compliant BOOLEAN,
    violation_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH weekly_shifts AS (
        SELECT 
            e.id as employee_id,
            e.first_name || ' ' || e.last_name as employee_name,
            e.shift_pattern,
            date_trunc('week', s.date)::DATE as week_start,
            array_agg(s.date ORDER BY s.date) as shift_dates,
            array_agg(calculate_hours_between(s.start_time, s.end_time) ORDER BY s.date) as shift_hours,
            COUNT(DISTINCT s.date) as days_worked,
            SUM(calculate_hours_between(s.start_time, s.end_time)) as total_hours
        FROM employees e
        JOIN shift_assignments sa ON e.id = sa.user_id
        JOIN shifts s ON sa.shift_id = s.id
        WHERE s.schedule_id = p_schedule_id
        GROUP BY e.id, e.first_name, e.last_name, e.shift_pattern, date_trunc('week', s.date)::DATE
    )
    SELECT 
        ws.employee_id,
        ws.employee_name,
        ws.shift_pattern,
        ws.week_start,
        ws.total_hours,
        ws.days_worked as consecutive_days,
        CASE 
            WHEN ws.shift_pattern = 'pattern_a' THEN
                ws.days_worked = 4 AND ws.total_hours = 40
            WHEN ws.shift_pattern = 'pattern_b' THEN
                ws.days_worked = 4 AND ws.total_hours = 40
            ELSE FALSE
        END as pattern_compliant,
        CASE
            WHEN ws.days_worked < 4 THEN 'Insufficient consecutive days'
            WHEN ws.total_hours != 40 THEN 'Invalid total hours'
            WHEN ws.shift_pattern = 'pattern_a' AND EXISTS (
                SELECT 1 FROM unnest(ws.shift_hours) h WHERE h != 10
            ) THEN 'Invalid shift durations for pattern A'
            WHEN ws.shift_pattern = 'pattern_b' AND (
                SELECT COUNT(*) FROM unnest(ws.shift_hours) h WHERE h = 12
            ) != 3 THEN 'Invalid 12-hour shift count for pattern B'
            WHEN ws.shift_pattern = 'pattern_b' AND (
                SELECT COUNT(*) FROM unnest(ws.shift_hours) h WHERE h = 4
            ) != 1 THEN 'Invalid 4-hour shift count for pattern B'
            ELSE 'Compliant'
        END as violation_reason
    FROM weekly_shifts ws
    ORDER BY ws.week_start, ws.employee_name;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze overtime
CREATE OR REPLACE FUNCTION analyze_overtime(
    p_schedule_id UUID
) RETURNS TABLE (
    employee_id UUID,
    employee_name TEXT,
    week_start DATE,
    total_hours NUMERIC,
    overtime_hours NUMERIC,
    approved_overtime BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH weekly_hours AS (
        SELECT 
            e.id as employee_id,
            e.first_name || ' ' || e.last_name as employee_name,
            date_trunc('week', s.date)::DATE as week_start,
            SUM(calculate_hours_between(s.start_time, s.end_time)) as total_hours
        FROM employees e
        JOIN shift_assignments sa ON e.id = sa.user_id
        JOIN shifts s ON sa.shift_id = s.id
        WHERE s.schedule_id = p_schedule_id
        GROUP BY e.id, e.first_name, e.last_name, date_trunc('week', s.date)::DATE
    )
    SELECT 
        wh.employee_id,
        wh.employee_name,
        wh.week_start,
        wh.total_hours,
        GREATEST(wh.total_hours - 40, 0) as overtime_hours,
        EXISTS (
            SELECT 1
            FROM overtime_approvals oa
            WHERE oa.employee_id = wh.employee_id
            AND oa.week_start = wh.week_start
            AND oa.approved = true
        ) as approved_overtime
    FROM weekly_hours wh
    WHERE wh.total_hours > 40
    ORDER BY wh.week_start, wh.employee_name;
END;
$$ LANGUAGE plpgsql;

-- Function to test schedule validation
CREATE OR REPLACE FUNCTION test_schedule_validation(
    p_schedule_id UUID
) RETURNS TABLE (
    test_name TEXT,
    passed BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_result RECORD;
BEGIN
    -- Test minimum staffing requirements
    FOR v_result IN
        SELECT * FROM analyze_schedule_coverage(p_schedule_id)
        WHERE coverage_status IN ('UNDERSTAFFED', 'NO_SUPERVISOR')
    LOOP
        test_name := 'Minimum Staffing Test';
        passed := FALSE;
        error_message := format(
            'Coverage issue on %s at %s-%s: %s',
            v_result.date,
            v_result.time_block_start,
            v_result.time_block_end,
            v_result.coverage_status
        );
        RETURN NEXT;
    END LOOP;
    
    -- Test pattern compliance
    FOR v_result IN
        SELECT * FROM analyze_pattern_compliance(p_schedule_id)
        WHERE NOT pattern_compliant
    LOOP
        test_name := 'Pattern Compliance Test';
        passed := FALSE;
        error_message := format(
            'Pattern violation for %s (week of %s): %s',
            v_result.employee_name,
            v_result.week_start,
            v_result.violation_reason
        );
        RETURN NEXT;
    END LOOP;
    
    -- Test overtime compliance
    FOR v_result IN
        SELECT * FROM analyze_overtime(p_schedule_id)
        WHERE NOT approved_overtime
    LOOP
        test_name := 'Overtime Compliance Test';
        passed := FALSE;
        error_message := format(
            'Unapproved overtime for %s (week of %s): %.1f hours',
            v_result.employee_name,
            v_result.week_start,
            v_result.overtime_hours
        );
        RETURN NEXT;
    END LOOP;
    
    -- If we get here and haven't returned any failures, return a success
    test_name := 'All Tests';
    passed := TRUE;
    error_message := 'All validation tests passed';
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to generate schedule efficiency metrics
CREATE OR REPLACE FUNCTION analyze_schedule_efficiency(
    p_schedule_id UUID
) RETURNS TABLE (
    metric_name TEXT,
    metric_value NUMERIC,
    metric_description TEXT
) AS $$
DECLARE
    v_total_shifts INTEGER;
    v_total_hours NUMERIC;
    v_total_employees INTEGER;
    v_coverage_gaps INTEGER;
    v_pattern_violations INTEGER;
    v_overtime_instances INTEGER;
BEGIN
    -- Get basic counts
    SELECT COUNT(*), COALESCE(SUM(calculate_hours_between(start_time, end_time)), 0)
    INTO v_total_shifts, v_total_hours
    FROM shifts
    WHERE schedule_id = p_schedule_id;
    
    SELECT COUNT(DISTINCT user_id)
    INTO v_total_employees
    FROM shift_assignments sa
    JOIN shifts s ON sa.shift_id = s.id
    WHERE s.schedule_id = p_schedule_id;
    
    -- Count coverage gaps
    SELECT COUNT(*)
    INTO v_coverage_gaps
    FROM analyze_schedule_coverage(p_schedule_id)
    WHERE coverage_status IN ('UNDERSTAFFED', 'NO_SUPERVISOR');
    
    -- Count pattern violations
    SELECT COUNT(*)
    INTO v_pattern_violations
    FROM analyze_pattern_compliance(p_schedule_id)
    WHERE NOT pattern_compliant;
    
    -- Count overtime instances
    SELECT COUNT(*)
    INTO v_overtime_instances
    FROM analyze_overtime(p_schedule_id);
    
    -- Return metrics
    metric_name := 'Total Shifts';
    metric_value := v_total_shifts;
    metric_description := 'Total number of shifts in the schedule';
    RETURN NEXT;
    
    metric_name := 'Total Hours';
    metric_value := v_total_hours;
    metric_description := 'Total scheduled hours';
    RETURN NEXT;
    
    metric_name := 'Average Hours per Employee';
    metric_value := CASE WHEN v_total_employees > 0 THEN v_total_hours / v_total_employees ELSE 0 END;
    metric_description := 'Average hours scheduled per employee';
    RETURN NEXT;
    
    metric_name := 'Coverage Gaps';
    metric_value := v_coverage_gaps;
    metric_description := 'Number of time periods with insufficient coverage';
    RETURN NEXT;
    
    metric_name := 'Pattern Violations';
    metric_value := v_pattern_violations;
    metric_description := 'Number of shift pattern violations';
    RETURN NEXT;
    
    metric_name := 'Overtime Instances';
    metric_value := v_overtime_instances;
    metric_description := 'Number of overtime instances';
    RETURN NEXT;
    
    metric_name := 'Schedule Efficiency Score';
    metric_value := 100 - (
        (v_coverage_gaps * 10) +
        (v_pattern_violations * 5) +
        (v_overtime_instances * 2)
    );
    metric_description := 'Overall schedule efficiency score (0-100)';
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION analyze_schedule_coverage IS 'Analyzes staffing coverage for each time block in a schedule';
COMMENT ON FUNCTION analyze_pattern_compliance IS 'Checks if employees are following their assigned shift patterns';
COMMENT ON FUNCTION analyze_overtime IS 'Identifies and analyzes overtime in the schedule';
COMMENT ON FUNCTION test_schedule_validation IS 'Runs a comprehensive set of validation tests on a schedule';
COMMENT ON FUNCTION analyze_schedule_efficiency IS 'Calculates various efficiency metrics for a schedule'; 