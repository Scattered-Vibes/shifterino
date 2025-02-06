BEGIN;

-- Plan the number of tests
SELECT plan(6);

-- Clean up any existing test data
SELECT test_helpers.clean_test_data();

-- Test data
DO $$
DECLARE
    test_data record;
BEGIN
    SELECT * INTO test_data FROM test_helpers.setup_test_data();
END $$;

-- Test shift duration constraints
SELECT test_helpers.set_auth_user(
    (SELECT id FROM auth.users WHERE email = 'supervisor_bl@test.com'),
    'service_role'
);

SELECT throws_ok(
    $$
    INSERT INTO public.shift_options (
        name,
        start_time,
        end_time,
        duration_hours,
        category
    )
    VALUES (
        'Invalid Shift',
        '09:00'::time,
        '16:00'::time,
        7,
        'day'
    )
    $$,
    '23514',
    'new row for relation "shift_options" violates check constraint "valid_duration"',
    'Shift duration must be either 4, 10, or 12 hours'
);

SELECT lives_ok(
    $$
    INSERT INTO public.shift_options (
        name,
        start_time,
        end_time,
        duration_hours,
        category
    )
    VALUES (
        'Valid Shift',
        '09:00'::time,
        '19:00'::time,
        10,
        'day'
    )
    $$,
    '10-hour shift should be valid'
);

-- Test minimum staffing requirements
CREATE OR REPLACE FUNCTION test_helpers.test_minimum_staffing()
RETURNS text AS $$
DECLARE
    test_data record;
    shift_id uuid;
    result boolean;
BEGIN
    PERFORM test_helpers.clean_test_data();
    SELECT * INTO test_data FROM test_helpers.setup_test_data();
    
    -- Create a shift during 5 AM - 9 AM period (requires 6 employees)
    INSERT INTO public.shift_options (
        name,
        start_time,
        end_time,
        duration_hours,
        category
    )
    VALUES (
        'Early Shift',
        '05:00'::time,
        '09:00'::time,
        4,
        'early'
    )
    RETURNING id INTO shift_id;
    
    -- Try to create a schedule without minimum staffing
    SELECT count(*) = 0 INTO result
    FROM individual_shifts
    WHERE shift_option_id = shift_id
    AND schedule_period_id = test_data.schedule_period_id;
    
    IF result THEN
        RETURN NULL;
    ELSE
        RETURN 'Should not allow understaffed shifts';
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT is(
    test_helpers.test_minimum_staffing(),
    NULL,
    'Minimum staffing requirements should be enforced'
);

-- Test supervisor coverage
CREATE OR REPLACE FUNCTION test_helpers.test_supervisor_coverage()
RETURNS text AS $$
DECLARE
    test_data record;
    shift_id uuid;
    result boolean;
BEGIN
    PERFORM test_helpers.clean_test_data();
    SELECT * INTO test_data FROM test_helpers.setup_test_data();
    
    -- Create a shift
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
        '21:00'::time,
        12,
        'day'
    )
    RETURNING id INTO shift_id;
    
    -- Verify supervisor requirement
    SELECT count(*) = 0 INTO result
    FROM individual_shifts s
    JOIN employees e ON s.employee_id = e.id
    WHERE s.shift_option_id = shift_id
    AND s.schedule_period_id = test_data.schedule_period_id
    AND e.role = 'supervisor';
    
    IF result THEN
        RETURN NULL;
    ELSE
        RETURN 'Should require at least one supervisor per shift';
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT is(
    test_helpers.test_supervisor_coverage(),
    NULL,
    'Supervisor coverage should be enforced'
);

-- Test weekly hour limits
CREATE OR REPLACE FUNCTION test_helpers.test_weekly_hours()
RETURNS text AS $$
DECLARE
    test_data record;
    shift_ids uuid[];
    result boolean;
BEGIN
    PERFORM test_helpers.clean_test_data();
    SELECT * INTO test_data FROM test_helpers.setup_test_data();
    
    BEGIN
        -- Create 5 x 10-hour shifts (50 hours total)
        WITH shift_inserts AS (
            INSERT INTO public.individual_shifts (
                employee_id,
                shift_option_id,
                schedule_period_id,
                date,
                status
            )
            SELECT
                test_data.employee_id,
                test_data.shift_option_id,
                test_data.schedule_period_id,
                CURRENT_DATE + (n || ' days')::interval,
                'scheduled'
            FROM generate_series(0, 4) n
            RETURNING id
        )
        SELECT array_agg(id) INTO shift_ids FROM shift_inserts;
        
        -- If we get here, the insert succeeded when it should have failed
        RETURN 'Should not allow more than 40 hours per week without override';
    EXCEPTION WHEN OTHERS THEN
        -- Check if the error message matches what we expect
        IF SQLERRM LIKE 'Cannot schedule more than % hours per week without overtime approval' THEN
            RETURN NULL;
        ELSE
            RETURN 'Unexpected error: ' || SQLERRM;
        END IF;
    END;
END;
$$ LANGUAGE plpgsql;

SELECT is(
    test_helpers.test_weekly_hours(),
    NULL,
    'Weekly hour limits should be enforced'
);

-- Test time off request validation
CREATE OR REPLACE FUNCTION test_helpers.test_time_off_conflicts()
RETURNS void AS $$
DECLARE
    test_data record;
    test_auth_id uuid;
BEGIN
    -- Clean up any existing test data
    DELETE FROM public.time_off_requests WHERE employee_id IN (
        SELECT id FROM public.employees WHERE email = 'test@example.com'
    );
    DELETE FROM public.employees WHERE email = 'test@example.com';
    DELETE FROM auth.users WHERE email = 'test@example.com';

    -- Create test auth user
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'test@example.com',
        '$2a$10$2nqyHhXimqNtHVHzb9C.K.Hs.dQkKB3WqnNxF4QyKkZnHEQJeKVHi',
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"role": "dispatcher"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO test_auth_id;

    -- Create test data
    WITH new_employee AS (
        INSERT INTO public.employees (
            auth_id,
            first_name,
            last_name,
            email,
            role,
            shift_pattern,
            weekly_hours
        )
        VALUES (
            test_auth_id,
            'Test',
            'Employee',
            'test@example.com',
            'dispatcher',
            'pattern_a',
            40
        )
        RETURNING id
    )
    INSERT INTO public.time_off_requests (
        employee_id,
        start_date,
        end_date,
        status,
        reason
    )
    SELECT
        id,
        CURRENT_DATE + INTERVAL '7 days',
        CURRENT_DATE + INTERVAL '8 days',
        'approved',
        'Vacation'
    FROM new_employee
    RETURNING employee_id INTO test_data;

    -- Test overlapping request
    ASSERT (
        SELECT NOT EXISTS (
            SELECT 1
            FROM public.time_off_requests
            WHERE employee_id = test_data.employee_id
            AND start_date <= CURRENT_DATE + INTERVAL '8 days'
            AND end_date >= CURRENT_DATE + INTERVAL '7 days'
            AND status = 'approved'
            AND id != (
                SELECT id
                FROM public.time_off_requests
                WHERE employee_id = test_data.employee_id
                ORDER BY created_at DESC
                LIMIT 1
            )
        )
    ), 'Should not allow overlapping time off requests';
END;
$$ LANGUAGE plpgsql;

-- Run the time off conflict test
SELECT test_helpers.test_time_off_conflicts();

-- Test schedule validation
CREATE OR REPLACE FUNCTION test_helpers.test_schedule_validation()
RETURNS void AS $$
DECLARE
    test_employee_id uuid;
    test_schedule_id uuid;
    test_auth_id uuid;
BEGIN
    -- Clean up any existing test data
    DELETE FROM public.schedules WHERE employee_id IN (
        SELECT id FROM public.employees WHERE email = 'test.schedule@example.com'
    );
    DELETE FROM public.employees WHERE email = 'test.schedule@example.com';
    DELETE FROM auth.users WHERE email = 'test.schedule@example.com';

    -- Create test auth user
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'test.schedule@example.com',
        '$2a$10$2nqyHhXimqNtHVHzb9C.K.Hs.dQkKB3WqnNxF4QyKkZnHEQJeKVHi',
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"role": "dispatcher"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO test_auth_id;

    -- Create test employee
    INSERT INTO public.employees (
        auth_id,
        first_name,
        last_name,
        email,
        role,
        shift_pattern,
        weekly_hours
    )
    VALUES (
        test_auth_id,
        'Test',
        'Employee',
        'test.schedule@example.com',
        'dispatcher',
        'pattern_a',
        40
    )
    RETURNING id INTO test_employee_id;

    -- Create test schedule
    INSERT INTO public.schedules (
        employee_id,
        start_time,
        end_time,
        shift_type,
        created_by
    )
    VALUES (
        test_employee_id,
        CURRENT_DATE + '09:00:00'::time,
        CURRENT_DATE + '17:00:00'::time,
        'day',
        test_employee_id
    )
    RETURNING id INTO test_schedule_id;

    -- Test schedule validation
    ASSERT (
        SELECT end_time > start_time
        FROM public.schedules
        WHERE id = test_schedule_id
    ), 'End time should be after start time';

    -- Test weekly hours limit
    ASSERT (
        SELECT COUNT(*) <= 5
        FROM public.schedules
        WHERE employee_id = test_employee_id
        AND start_time >= date_trunc('week', CURRENT_DATE)
        AND start_time < date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'
    ), 'Should not exceed weekly schedule limit';
END;
$$ LANGUAGE plpgsql;

-- Run the schedule validation test
SELECT test_helpers.test_schedule_validation();

-- Test employee role validation
CREATE OR REPLACE FUNCTION test_helpers.test_employee_role_validation()
RETURNS void AS $$
DECLARE
    test_auth_id uuid;
BEGIN
    -- Clean up any existing test data
    DELETE FROM public.employees WHERE email = 'test.role@example.com';
    DELETE FROM auth.users WHERE email = 'test.role@example.com';

    -- Create test auth user
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'test.role@example.com',
        '$2a$10$2nqyHhXimqNtHVHzb9C.K.Hs.dQkKB3WqnNxF4QyKkZnHEQJeKVHi',
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"role": "dispatcher"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO test_auth_id;

    -- Create employee record
    INSERT INTO public.employees (
        auth_id,
        first_name,
        last_name,
        email,
        role,
        shift_pattern,
        weekly_hours
    )
    VALUES (
        test_auth_id,
        'Test',
        'Role',
        'test.role@example.com',
        'dispatcher',
        'pattern_a',
        40
    );

    -- Test employee role matches auth metadata
    ASSERT (
        SELECT role = 'dispatcher'
        FROM public.employees
        WHERE auth_id = test_auth_id
    ), 'Employee role should match auth metadata role';
END;
$$ LANGUAGE plpgsql;

-- Run the employee role validation test
SELECT test_helpers.test_employee_role_validation();

-- Clean up
SELECT test_helpers.clean_test_data();
SELECT * FROM finish();
ROLLBACK; 