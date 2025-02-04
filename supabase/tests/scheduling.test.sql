-- Start transaction and plan the tests
BEGIN;
SELECT plan(26);

-- Test 1: Verify employee counts
SELECT is(
    (SELECT COUNT(*) FROM employees WHERE role = 'supervisor'),
    2::bigint,
    'Should have 2 supervisors'
);

SELECT is(
    (SELECT COUNT(*) FROM employees WHERE role = 'dispatcher'),
    6::bigint,
    'Should have 6 dispatchers'
);

-- Test 2: Verify shift options
SELECT is(
    (SELECT COUNT(*) FROM shift_options),
    4::bigint,
    'Should have 4 shift options'
);

-- Test 3: Verify staffing requirements
SELECT is(
    (SELECT COUNT(*) FROM staffing_requirements),
    4::bigint,
    'Should have 4 staffing requirement blocks'
);

-- Test 4: Verify schedule periods
SELECT is(
    (SELECT COUNT(*) FROM schedule_periods WHERE is_active = true),
    1::bigint,
    'Should have 1 active schedule period'
);

-- Test 5: Verify individual shifts
SELECT is(
    (SELECT COUNT(*) FROM individual_shifts WHERE status = 'scheduled'),
    3::bigint,
    'Should have 3 scheduled shifts'
);

-- Test 6: Verify time off requests
SELECT is(
    (SELECT COUNT(*) FROM time_off_requests WHERE status = 'pending'),
    1::bigint,
    'Should have 1 pending time off request'
);

-- Test 7: Verify shift swap requests
SELECT is(
    (SELECT COUNT(*) FROM shift_swap_requests WHERE status = 'pending'),
    1::bigint,
    'Should have 1 pending shift swap request'
);

-- Test 8: Verify shift pattern constraints
SELECT ok(
    NOT EXISTS (
        SELECT 1
        FROM individual_shifts i
        JOIN employees e ON e.id = i.employee_id
        JOIN shift_options so ON so.id = i.shift_option_id
        GROUP BY e.id, e.shift_pattern
        HAVING 
            (e.shift_pattern = 'pattern_a' AND COUNT(*) > 4) OR
            (e.shift_pattern = 'pattern_b' AND COUNT(*) > 4)
    ),
    'No employees should exceed their shift pattern limits'
);

-- Test 9: Verify weekly hours constraints
SELECT ok(
    NOT EXISTS (
        SELECT 1
        FROM individual_shifts i
        JOIN shift_options so ON so.id = i.shift_option_id
        GROUP BY i.employee_id
        HAVING SUM(so.duration_hours) > 40
    ),
    'No employees should exceed 40 weekly hours'
);

-- Test 10: Verify supervisor coverage
SELECT ok(
    NOT EXISTS (
        SELECT 1
        FROM staffing_requirements sr
        LEFT JOIN individual_shifts i ON i.date = CURRENT_DATE
        LEFT JOIN employees e ON e.id = i.employee_id AND e.role = 'supervisor'
        LEFT JOIN shift_options so ON so.id = i.shift_option_id
        GROUP BY sr.time_block_start, sr.time_block_end, sr.min_supervisors
        HAVING COUNT(DISTINCT CASE WHEN e.role = 'supervisor' THEN e.id END) < sr.min_supervisors
    ),
    'Each time block should have minimum required supervisors'
);

-- Test 11: Verify views
SELECT has_view('public', 'v_current_schedule', 'View v_current_schedule should exist');
SELECT has_view('public', 'v_staffing_levels', 'View v_staffing_levels should exist');

-- Test 12: Verify materialized view
SELECT has_materialized_view(
    'public', 'mv_schedule_statistics',
    'Materialized view mv_schedule_statistics should exist'
);

-- Test 13: Verify RLS policies
SELECT policies_are('public', 'employees',
    ARRAY['View own profile', 'View all profiles as supervisor'],
    'Employees table should have expected policies'
);

-- Test 14: Verify functions
SELECT has_function(
    'public', 'calculate_consecutive_shifts',
    ARRAY['uuid', 'date'],
    'Function calculate_consecutive_shifts should exist'
);

SELECT has_function(
    'public', 'calculate_weekly_hours',
    ARRAY['uuid', 'date'],
    'Function calculate_weekly_hours should exist'
);

SELECT has_function(
    'public', 'validate_shift_pattern',
    ARRAY['uuid', 'date', 'integer'],
    'Function validate_shift_pattern should exist'
);

-- Test 15: Verify triggers
SELECT has_trigger(
    'public', 'individual_shifts', 'validate_shift_pattern_trigger',
    'Trigger validate_shift_pattern_trigger should exist'
);

SELECT has_trigger(
    'public', 'individual_shifts', 'update_employee_stats_trigger',
    'Trigger update_employee_stats_trigger should exist'
);

-- Test 16: Verify enum types
SELECT has_type('public', 'employee_role', 'Type employee_role should exist');
SELECT has_type('public', 'shift_pattern', 'Type shift_pattern should exist');
SELECT has_type('public', 'shift_category', 'Type shift_category should exist');
SELECT has_type('public', 'time_off_status', 'Type time_off_status should exist');
SELECT has_type('public', 'shift_status', 'Type shift_status should exist');
SELECT has_type('public', 'log_severity', 'Type log_severity should exist');

-- Finish the tests and clean up
SELECT * FROM finish();
ROLLBACK; 