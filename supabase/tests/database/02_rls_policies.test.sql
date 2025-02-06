BEGIN;

-- Plan the number of tests
SELECT plan(30);

-- Create test_helpers schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS test_helpers;

-- Clean up any existing test data
SELECT test_helpers.clean_test_data();

-- Setup test data
DO $$
DECLARE
    manager_data record;
    supervisor_data record;
    employee_data record;
    schedule_id uuid;
    shift_option_id uuid;
    shift_id uuid;
BEGIN
    -- Create test users with unique suffixes
    SELECT * INTO manager_data FROM test_helpers.create_test_user('manager@test.com', 'manager', 'rls1');
    SELECT * INTO supervisor_data FROM test_helpers.create_test_user('supervisor@test.com', 'supervisor', 'rls1');
    SELECT * INTO employee_data FROM test_helpers.create_test_user('employee@test.com', 'dispatcher', 'rls1');
    
    -- Create test schedule period
    INSERT INTO public.schedule_periods (start_date, end_date)
    VALUES (CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days')
    RETURNING id INTO schedule_id;
    
    -- Create test shift option
    INSERT INTO public.shift_options (
        name,
        start_time,
        end_time,
        duration_hours,
        category
    )
    VALUES (
        'Day Shift',
        '09:00'::time,
        '19:00'::time,
        10,
        'day'
    )
    RETURNING id INTO shift_option_id;
    
    -- Create test individual shift
    INSERT INTO public.individual_shifts (
        employee_id,
        shift_option_id,
        schedule_period_id,
        date,
        status
    )
    VALUES (
        employee_data.employee_id,
        shift_option_id,
        schedule_id,
        CURRENT_DATE,
        'scheduled'
    )
    RETURNING id INTO shift_id;
    
    -- Create test time off request
    INSERT INTO public.time_off_requests (
        employee_id,
        start_date,
        end_date,
        status
    )
    VALUES (
        employee_data.employee_id,
        CURRENT_DATE + INTERVAL '14 days',
        CURRENT_DATE + INTERVAL '15 days',
        'pending'
    );
END $$;

-- Test RLS policies for profiles table
SELECT test_helpers.set_auth_user(NULL, 'anon');
SELECT results_eq(
    'SELECT count(*) FROM profiles',
    ARRAY[0]::bigint[],
    'Anon users should not see any profiles'
);

SELECT test_helpers.set_auth_user(
    (SELECT id FROM auth.users WHERE email = 'employee_rls1@test.com'),
    'authenticated'
);
SELECT results_eq(
    'SELECT count(*) FROM profiles WHERE email = ''employee_rls1@test.com''',
    ARRAY[1]::bigint[],
    'Authenticated users should only see their own profile'
);

-- Test RLS policies for employees table
DO $$
DECLARE
    manager_id uuid;
    supervisor_id uuid;
    dispatcher_id uuid;
    other_dispatcher_id uuid;
BEGIN
    -- Clean up any existing test data
    DELETE FROM public.employees WHERE email LIKE 'rls1_%';
    DELETE FROM auth.users WHERE email LIKE 'rls1_%';

    -- Create test users with different roles
    manager_id := test_helpers.create_test_user('manager@test.com', 'manager', 'rls1');
    supervisor_id := test_helpers.create_test_user('supervisor@test.com', 'supervisor', 'rls1');
    dispatcher_id := test_helpers.create_test_user('dispatcher@test.com', 'dispatcher', 'rls1');
    other_dispatcher_id := test_helpers.create_test_user('other.dispatcher@test.com', 'dispatcher', 'rls1');

    -- Test manager access
    SET LOCAL ROLE authenticated;
    SELECT auth.set_auth_user(manager_id::text);

    SELECT results_eq(
        'SELECT COUNT(*) FROM employees WHERE email LIKE ''rls1_%''',
        ARRAY[4::bigint],
        'Managers should see all employees'
    );

    -- Test supervisor access
    SELECT auth.set_auth_user(supervisor_id::text);

    SELECT results_eq(
        'SELECT COUNT(*) FROM employees WHERE email LIKE ''rls1_%''',
        ARRAY[4::bigint],
        'Supervisors should see all employees'
    );

    -- Test dispatcher access
    SELECT auth.set_auth_user(dispatcher_id::text);

    SELECT results_eq(
        'SELECT COUNT(*) FROM employees WHERE auth_id = auth.uid()',
        ARRAY[1::bigint],
        'Dispatchers should only see their own record'
    );

    -- Reset role
    RESET ROLE;
END;
$$;

-- Test RLS policies for schedules table
DO $$
DECLARE
    manager_id uuid;
    supervisor_id uuid;
    dispatcher_id uuid;
BEGIN
    -- Clean up any existing test data
    DELETE FROM public.employees WHERE email LIKE 'rls2_%';
    DELETE FROM auth.users WHERE email LIKE 'rls2_%';

    -- Create test users
    manager_id := test_helpers.create_test_user('manager@test.com', 'manager', 'rls2');
    supervisor_id := test_helpers.create_test_user('supervisor@test.com', 'supervisor', 'rls2');
    dispatcher_id := test_helpers.create_test_user('dispatcher@test.com', 'dispatcher', 'rls2');

    -- Test manager access
    SET LOCAL ROLE authenticated;
    SELECT auth.set_auth_user(manager_id::text);

    SELECT results_eq(
        'SELECT COUNT(*) FROM schedules',
        ARRAY[0::bigint],
        'Managers should see all schedules'
    );

    -- Test supervisor access
    SELECT auth.set_auth_user(supervisor_id::text);

    SELECT results_eq(
        'SELECT COUNT(*) FROM schedules',
        ARRAY[0::bigint],
        'Supervisors should see all schedules'
    );

    -- Test dispatcher access
    SELECT auth.set_auth_user(dispatcher_id::text);

    SELECT results_eq(
        'SELECT COUNT(*) FROM schedules WHERE employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())',
        ARRAY[0::bigint],
        'Dispatchers should only see their own schedules'
    );

    -- Reset role
    RESET ROLE;
END;
$$;

-- Test individual_shifts policies
SELECT test_helpers.set_auth_user(
    (SELECT id FROM auth.users WHERE email = 'employee_rls1@test.com'),
    'authenticated'
);
SELECT results_eq(
    'SELECT count(*) FROM individual_shifts s WHERE s.employee_id IN (SELECT id FROM employees WHERE email = ''employee_rls1@test.com'')',
    ARRAY[1]::bigint[],
    'Employees should only see their own shifts'
);

-- Test time_off_requests policies
SELECT results_eq(
    'SELECT count(*) FROM time_off_requests tor WHERE tor.employee_id IN (SELECT id FROM employees WHERE email = ''employee_rls1@test.com'')',
    ARRAY[1]::bigint[],
    'Employees should only see their own time off requests'
);

SELECT test_helpers.set_auth_user(
    (SELECT id FROM auth.users WHERE email = 'manager_rls1@test.com'),
    'service_role'
);
SELECT results_eq(
    'SELECT count(*) FROM time_off_requests',
    ARRAY[1]::bigint[],
    'Service role should see all time off requests'
);

-- Test schedule viewing policies
SELECT test_helpers.set_auth_user(
    (SELECT id FROM auth.users WHERE email = 'employee_rls1@test.com'),
    'authenticated'
);
SELECT results_eq(
    'SELECT count(*) FROM schedule_periods',
    ARRAY[1]::bigint[],
    'All authenticated users should see schedule periods'
);

-- Test shift modification policies
SELECT throws_ok(
    'INSERT INTO shift_options (name, start_time, end_time, duration_hours, category) VALUES (''Test Shift'', ''09:00'', ''19:00'', 10, ''day'')',
    'new row violates row-level security policy for table "shift_options"'
);

SELECT test_helpers.set_auth_user(
    (SELECT id FROM auth.users WHERE email = 'manager_rls1@test.com'),
    'service_role'
);
SELECT lives_ok(
    'INSERT INTO shift_options (name, start_time, end_time, duration_hours, category) VALUES (''Test Shift'', ''09:00'', ''19:00'', 10, ''day'')',
    'Service role should be able to create shift options'
);

-- Clean up
SELECT test_helpers.clean_test_data();
SELECT * FROM finish();
ROLLBACK;

DO $$
DECLARE
    manager_id uuid;
    supervisor_id uuid;
    dispatcher_id uuid;
BEGIN
    -- Clean up any existing test data
    PERFORM test_helpers.clean_test_data();
    
    -- Create test users with unique IDs
    SELECT auth_id INTO manager_id
    FROM test_helpers.create_test_user('manager@test.com', 'manager', 'rls1');
    
    SELECT auth_id INTO supervisor_id
    FROM test_helpers.create_test_user('supervisor@test.com', 'supervisor', 'rls2');
    
    SELECT auth_id INTO dispatcher_id
    FROM test_helpers.create_test_user('dispatcher@test.com', 'dispatcher', 'rls3');
    
    -- Set up test data
    INSERT INTO public.shift_options (id, name, start_time, end_time, duration_hours, category)
    VALUES (
        gen_random_uuid(),
        'RLS Test Shift',
        '09:00',
        '17:00',
        8,
        'day'
    );
    
    INSERT INTO public.schedule_periods (id, start_date, end_date, description, is_active)
    VALUES (
        gen_random_uuid(),
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '28 days',
        'RLS Test Period',
        true
    );
END;
$$; 