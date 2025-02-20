-- Clean up any existing test data first
SELECT tests.cleanup_test_data();

-- Begin transaction and plan the tests
BEGIN;
SELECT plan(10);

-- Create test user and store their ID
DO $$
DECLARE
    test_user_id uuid;
    test_employee_id uuid;
    test_schedule_period_id uuid;
BEGIN
    -- Create user in auth.users table (this will trigger employee creation)
    test_user_id := tests.create_supabase_user('test@example.com');

    -- Get the employee ID that was created by the trigger
    SELECT id INTO test_employee_id
    FROM public.employees
    WHERE auth_id = test_user_id;

    -- Update the employee record that was created by the trigger
    UPDATE public.employees 
    SET first_name = 'Test',
        last_name = 'Employee',
        role = 'dispatcher',
        shift_pattern = '4x10'
    WHERE auth_id = test_user_id;

    -- Create test schedule period
    INSERT INTO public.schedule_periods (id, start_date, end_date, status)
    VALUES ('88888888-8888-8888-8888-888888888888', CURRENT_DATE, CURRENT_DATE + 30, 'draft')
    RETURNING id INTO test_schedule_period_id;

    -- Create test shift options
    INSERT INTO public.shift_options (id, name, category, start_time, end_time, duration_hours)
    VALUES 
        ('22222222-2222-2222-2222-222222222222', 'Day Shift', 'day', '09:00', '17:00', 8),
        ('33333333-3333-3333-3333-333333333333', 'Early Day', 'day', '05:00', '15:00', 10);

    -- Create test individual shifts
    INSERT INTO public.individual_shifts (
        id, employee_id, shift_option_id, shift_date, schedule_period_id, status
    ) VALUES (
        '44444444-4444-4444-4444-444444444444',
        test_employee_id,
        '22222222-2222-2222-2222-222222222222',
        CURRENT_DATE,
        test_schedule_period_id,
        'scheduled'
    );

    -- Create test staffing requirements
    INSERT INTO public.staffing_requirements (
        id, name, time_block_start, time_block_end,
        min_total_staff, min_supervisors, day_of_week, schedule_period_id
    ) VALUES (
        '55555555-5555-5555-5555-555555555555',
        'Morning',
        '05:00',
        '09:00',
        6,
        1,
        0,
        test_schedule_period_id
    );

    -- Create test time off requests
    INSERT INTO public.time_off_requests (
        id, employee_id, start_date, end_date, type, reason, status
    ) VALUES (
        '66666666-6666-6666-6666-666666666666',
        test_employee_id,
        CURRENT_DATE,
        CURRENT_DATE + 1,
        'vacation',
        'Test request',
        'pending'
    );

    -- Store test variables for use in test queries
    PERFORM set_config('test.employee_id', test_employee_id::text, true);
END $$;

-- Test shift overlap constraint
SELECT throws_ok(
    $$
    INSERT INTO public.individual_shifts (
        employee_id, shift_option_id, shift_date, schedule_period_id, status
    ) VALUES (
        (SELECT id FROM public.employees WHERE email = 'test@example.com'),
        '33333333-3333-3333-3333-333333333333',
        CURRENT_DATE,
        '88888888-8888-8888-8888-888888888888',
        'scheduled'
    )
    $$,
    'no_overlapping_shifts',
    'Shift overlaps with an existing assignment',
    'Cannot assign overlapping shifts'
);

-- Test staffing requirements constraint
SELECT throws_ok(
    $$
    INSERT INTO public.staffing_requirements (
        name, time_block_start, time_block_end, min_total_staff, min_supervisors,
        day_of_week, schedule_period_id
    ) VALUES (
        'Invalid Staff', '05:00', '09:00', 5, 6, 0,
        '88888888-8888-8888-8888-888888888888'
    )
    $$,
    'valid_staff_count',
    'Total staff must be greater than or equal to minimum supervisors',
    'Cannot have more required supervisors than total staff'
);

-- Test supervisor approval constraint
SELECT throws_ok(
    $$
    UPDATE public.individual_shifts 
    SET status = 'approved', supervisor_approved_at = NULL
    WHERE id = '44444444-4444-4444-4444-444444444444'
    $$,
    'supervisor_approval_complete',
    'Approved shifts must have supervisor approval timestamp',
    'Cannot approve shift without supervisor approval timestamp'
);

-- Test shift duration constraint
SELECT throws_ok(
    $$
    INSERT INTO public.shift_options (
        name, category, start_time, end_time, duration_hours
    ) VALUES (
        'Invalid Duration', 'day', '09:00', '22:00', 13
    )
    $$,
    'valid_duration',
    'Shift duration must be between 0 and 12 hours',
    'Cannot create shift with duration over 12 hours'
);

-- Test time off request date constraint
SELECT throws_ok(
    $$
    INSERT INTO public.time_off_requests (
        employee_id, start_date, end_date, type, reason, status
    ) VALUES (
        (SELECT id FROM public.employees WHERE email = 'test@example.com'),
        CURRENT_DATE + 1,
        CURRENT_DATE,
        'vacation',
        'Invalid dates',
        'pending'
    )
    $$,
    'valid_date_range',
    'End date must be after or equal to start date',
    'Cannot create time off request with end date before start date'
);

-- Test employee role enum constraint
SELECT throws_ok(
    $$
    UPDATE public.employees 
    SET role = 'invalid_role'
    WHERE id = (SELECT id FROM public.employees LIMIT 1)
    $$,
    '22P02',
    'invalid input value for enum employee_role: "invalid_role"',
    'Cannot assign invalid employee role'
);

-- Test shift pattern enum constraint
SELECT throws_ok(
    $$
    UPDATE public.employees 
    SET shift_pattern = 'invalid_pattern'
    WHERE id = (SELECT id FROM public.employees LIMIT 1)
    $$,
    '22P02',
    'invalid input value for enum shift_pattern: "invalid_pattern"',
    'Cannot assign invalid shift pattern'
);

-- Test time off status enum constraint
SELECT throws_ok(
    $$
    UPDATE public.time_off_requests 
    SET status = 'invalid_status'
    WHERE id = '66666666-6666-6666-6666-666666666666'
    $$,
    '22P02',
    'invalid input value for enum time_off_status: "invalid_status"',
    'Cannot assign invalid time off status'
);

-- Test schedule period date range constraint
SELECT throws_ok(
    $$
    INSERT INTO public.schedule_periods (
        start_date, end_date, status
    ) VALUES (
        CURRENT_DATE + 1,
        CURRENT_DATE,
        'draft'
    )
    $$,
    'valid_schedule_period_dates',
    'End date must be after start date',
    'Cannot create schedule period with end date before start date'
);

-- Test weekly hours constraint
SELECT throws_ok(
    $$
    WITH test_data AS (
        SELECT 
            e.id as employee_id,
            sp.id as schedule_period_id,
            so.id as shift_option_id,
            generate_series(CURRENT_DATE, CURRENT_DATE + 4, '1 day'::interval)::date as shift_date
        FROM public.employees e
        CROSS JOIN public.schedule_periods sp
        CROSS JOIN public.shift_options so
        WHERE e.email = 'test@example.com'
        AND so.duration_hours = 12
        LIMIT 5
    )
    INSERT INTO public.individual_shifts (
        employee_id, shift_option_id, shift_date, schedule_period_id, status
    )
    SELECT 
        employee_id,
        shift_option_id,
        shift_date,
        schedule_period_id,
        'scheduled'
    FROM test_data
    $$,
    'weekly_hours_limit',
    'Weekly hours exceed employee cap',
    'Cannot schedule more than weekly hours cap'
);

SELECT * FROM finish();
ROLLBACK; 