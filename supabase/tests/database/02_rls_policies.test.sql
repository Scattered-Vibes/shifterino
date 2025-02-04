BEGIN;

-- Plan the number of tests
SELECT plan(30);

-- Create test_helpers schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS test_helpers;

-- Clean up any existing test data
SELECT test_helpers.clean_test_data();

-- Drop and recreate the create_test_user function
DROP FUNCTION IF EXISTS test_helpers.create_test_user(text, text);
DROP FUNCTION IF EXISTS test_helpers.create_test_user(text, text, text);

CREATE OR REPLACE FUNCTION test_helpers.create_test_user(
    p_email text,
    p_role text,
    p_suffix text DEFAULT ''
) RETURNS TABLE (
    auth_id uuid,
    employee_id uuid
) AS $$
DECLARE
    v_auth_id uuid;
    v_employee_id uuid;
    v_email text;
BEGIN
    -- Add unique suffix to email if provided
    IF p_suffix = '' THEN
        v_email := p_email;
    ELSE
        v_email := replace(p_email, '@', '_' || p_suffix || '@');
    END IF;

    -- Insert auth user with default values
    INSERT INTO auth.users (
        email,
        role,
        encrypted_password,
        raw_user_meta_data,
        created_at,
        updated_at
    )
    VALUES (
        v_email,
        p_role,
        'test-password',
        jsonb_build_object('role', p_role),
        NOW(),
        NOW()
    )
    RETURNING id INTO v_auth_id;
    
    -- Insert profile
    INSERT INTO public.profiles (id, email, role)
    VALUES (v_auth_id, v_email, p_role);
    
    -- Insert employee
    INSERT INTO public.employees (
        auth_id,
        first_name,
        last_name,
        email,
        role,
        shift_pattern
    )
    VALUES (
        v_auth_id,
        'Test',
        'User',
        v_email,
        p_role::employee_role,
        'pattern_a'
    )
    RETURNING id INTO v_employee_id;
    
    RETURN QUERY SELECT v_auth_id, v_employee_id;
END;
$$ LANGUAGE plpgsql;

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
SELECT test_helpers.set_auth_user(
    (SELECT id FROM auth.users WHERE email = 'employee_rls1@test.com'),
    'authenticated'
);
SELECT results_eq(
    'SELECT count(*) FROM employees WHERE email = ''employee_rls1@test.com''',
    ARRAY[1]::bigint[],
    'Employees should only see their own record'
);

SELECT test_helpers.set_auth_user(
    (SELECT id FROM auth.users WHERE email = 'manager_rls1@test.com'),
    'service_role'
);
SELECT results_eq(
    'SELECT count(*) FROM employees',
    ARRAY[3]::bigint[],
    'Service role should see all employees'
);

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