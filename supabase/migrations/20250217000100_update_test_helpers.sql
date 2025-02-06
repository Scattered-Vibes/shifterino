-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS test_helpers.setup_test_data();
DROP FUNCTION IF EXISTS test_helpers.clean_test_data();
DROP FUNCTION IF EXISTS test_helpers.create_test_user(text, text);
DROP FUNCTION IF EXISTS test_helpers.create_test_user(text, text, text);
DROP FUNCTION IF EXISTS test_helpers.clean_test_user(text);

-- Create function to clean test data
CREATE OR REPLACE FUNCTION test_helpers.clean_test_data()
RETURNS void AS $$
DECLARE
    v_count int;
BEGIN
    RAISE NOTICE 'Starting test data cleanup...';
    
    -- Disable triggers temporarily to avoid side effects during cleanup
    SET session_replication_role = 'replica';
    
    -- 1. Start with the most dependent tables first
    DELETE FROM public.shift_swap_requests;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from shift_swap_requests', v_count;
    
    DELETE FROM public.shift_assignment_scores;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from shift_assignment_scores', v_count;
    
    DELETE FROM public.scheduling_logs;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from scheduling_logs', v_count;
    
    -- 2. Delete individual shifts before employees
    DELETE FROM public.individual_shifts;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from individual_shifts', v_count;
    
    -- 3. Delete time off requests before employees
    DELETE FROM public.time_off_requests;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from time_off_requests', v_count;
    
    -- 4. Delete test shift options
    DELETE FROM public.shift_options WHERE name LIKE 'Test%';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from shift_options', v_count;
    
    -- 5. Delete schedule periods
    DELETE FROM public.schedule_periods;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from schedule_periods', v_count;
    
    -- 6. Handle created_by references before deleting employees
    UPDATE public.employees SET created_by = NULL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Updated % rows in employees (created_by to NULL)', v_count;
    
    -- 7. Now safe to delete employees
    DELETE FROM public.employees;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from employees', v_count;
    
    -- 8. Delete profiles and auth users
    DELETE FROM public.profiles;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from profiles', v_count;
    
    DELETE FROM auth.users;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from auth.users', v_count;
    
    -- 9. Clean up test data table if it exists
    DELETE FROM public.test_data;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from test_data', v_count;
    
    -- 10. Reset sequences if they exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_schema = 'public') THEN
        ALTER SEQUENCE IF EXISTS public.employees_id_seq RESTART;
        ALTER SEQUENCE IF EXISTS public.profiles_id_seq RESTART;
        ALTER SEQUENCE IF EXISTS public.shift_options_id_seq RESTART;
        ALTER SEQUENCE IF EXISTS public.schedule_periods_id_seq RESTART;
        RAISE NOTICE 'Reset all relevant sequences';
    END IF;
    
    -- Re-enable triggers
    SET session_replication_role = 'origin';
    RAISE NOTICE 'Test data cleanup completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Create function to clean specific test user
CREATE OR REPLACE FUNCTION test_helpers.clean_test_user(p_email text)
RETURNS void AS $$
DECLARE
    v_count int;
    v_auth_id uuid;
    v_employee_id uuid;
BEGIN
    RAISE NOTICE 'Starting cleanup for user with email: %', p_email;
    
    -- Get IDs for the user if they exist
    SELECT e.auth_id, e.id INTO v_auth_id, v_employee_id
    FROM public.employees e
    WHERE e.email = p_email;
    
    -- Also check profiles table in case employee record is missing
    IF v_auth_id IS NULL THEN
        SELECT p.id INTO v_auth_id
        FROM public.profiles p
        WHERE p.email = p_email;
        
        -- Also check auth.users table in case profile is missing
        IF v_auth_id IS NULL THEN
            SELECT u.id INTO v_auth_id
            FROM auth.users u
            WHERE u.email = p_email;
        END IF;
    END IF;
    
    -- If no user found anywhere, log and return
    IF v_auth_id IS NULL THEN
        RAISE NOTICE 'No user found with email: %', p_email;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user - auth_id: %, employee_id: %', v_auth_id, v_employee_id;
    
    -- Disable triggers temporarily
    SET session_replication_role = 'replica';
    
    -- 1. Delete shift-related records
    DELETE FROM public.shift_swap_requests
    WHERE shift_id IN (
        SELECT id FROM public.individual_shifts 
        WHERE employee_id = v_employee_id
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from shift_swap_requests', v_count;
    
    DELETE FROM public.shift_assignment_scores
    WHERE shift_id IN (
        SELECT id FROM public.individual_shifts 
        WHERE employee_id = v_employee_id
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from shift_assignment_scores', v_count;
    
    DELETE FROM public.scheduling_logs
    WHERE related_employee_id = v_employee_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from scheduling_logs', v_count;
    
    DELETE FROM public.individual_shifts
    WHERE employee_id = v_employee_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from individual_shifts', v_count;
    
    -- 2. Delete time off requests
    DELETE FROM public.time_off_requests
    WHERE employee_id = v_employee_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from time_off_requests', v_count;
    
    -- 3. Handle created_by references
    UPDATE public.employees
    SET created_by = NULL
    WHERE created_by = v_auth_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Updated % rows in employees (created_by to NULL)', v_count;
    
    -- 4. Delete employee record if it exists
    IF v_employee_id IS NOT NULL THEN
        DELETE FROM public.employees WHERE id = v_employee_id;
        GET DIAGNOSTICS v_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % rows from employees', v_count;
    END IF;
    
    -- 5. Delete profile if it exists
    DELETE FROM public.profiles WHERE id = v_auth_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from profiles', v_count;
    
    -- 6. Finally delete auth user
    DELETE FROM auth.users WHERE id = v_auth_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from auth.users', v_count;
    
    -- Re-enable triggers
    SET session_replication_role = 'origin';
    RAISE NOTICE 'Cleanup completed for user %', p_email;
END;
$$ LANGUAGE plpgsql;

-- Create function to create test user with enhanced security
CREATE OR REPLACE FUNCTION test_helpers.create_test_user(
    p_email text,
    p_role text DEFAULT 'dispatcher',
    p_suffix text DEFAULT ''
) RETURNS TABLE (
    auth_id uuid,
    employee_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_auth_id uuid;
    v_employee_id uuid;
    v_email text;
BEGIN
    -- Generate unique email if suffix provided
    IF p_suffix <> '' THEN
        v_email := replace(p_email, '@', '_' || p_suffix || '@');
    ELSE
        v_email := p_email;
    END IF;
    
    RAISE NOTICE 'Creating test user with email: %', v_email;
    
    -- Clean up any existing test user
    PERFORM test_helpers.clean_test_user(v_email);
    
    -- Create auth user with full details
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
        v_email,
        '$2a$10$2nqyHhXimqNtHVHzb9C.K.Hs.dQkKB3WqnNxF4QyKkZnHEQJeKVHi',
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        format('{"role": "%s"}', p_role)::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO v_auth_id;
    
    RAISE NOTICE 'Created auth user with id: %', v_auth_id;
    
    -- Create profile
    INSERT INTO public.profiles (id, email, role)
    VALUES (v_auth_id, v_email, p_role);
    
    RAISE NOTICE 'Created profile for user: %', v_email;
    
    -- Create employee record
    INSERT INTO public.employees (
        auth_id,
        first_name,
        last_name,
        email,
        role,
        shift_pattern,
        weekly_hours_cap,
        created_by
    )
    VALUES (
        v_auth_id,
        'Test',
        split_part(p_role, '@', 1),
        v_email,
        p_role::employee_role,
        'pattern_a',
        40,
        v_auth_id  -- Set created_by to the same user for test data
    )
    RETURNING id INTO v_employee_id;
    
    RAISE NOTICE 'Created employee record with id: %', v_employee_id;
    
    RETURN QUERY SELECT v_auth_id, v_employee_id;
END;
$$;

-- Create setup_test_data function
CREATE OR REPLACE FUNCTION test_helpers.setup_test_data()
RETURNS TABLE (
    employee_id uuid,
    supervisor_id uuid,
    schedule_period_id uuid,
    shift_option_id uuid
) AS $$
DECLARE
    v_employee_id uuid;
    v_supervisor_id uuid;
    v_schedule_period_id uuid;
    v_shift_option_id uuid;
    supervisor_data record;
    employee_data record;
BEGIN
    -- Clean any existing test data
    PERFORM test_helpers.clean_test_data();
    
    RAISE NOTICE 'Creating test supervisor...';
    -- Create test supervisor
    SELECT * INTO supervisor_data FROM test_helpers.create_test_user('supervisor@test.com', 'supervisor', 'bl');
    v_supervisor_id := supervisor_data.employee_id;
    
    RAISE NOTICE 'Creating test employee...';
    -- Create test employee
    SELECT * INTO employee_data FROM test_helpers.create_test_user('employee@test.com', 'dispatcher', 'bl');
    v_employee_id := employee_data.employee_id;
    
    RAISE NOTICE 'Creating test schedule period...';
    -- Create test schedule period
    INSERT INTO public.schedule_periods (start_date, end_date)
    VALUES (CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days')
    RETURNING id INTO v_schedule_period_id;
    
    RAISE NOTICE 'Creating test shift option...';
    -- Create test shift option
    INSERT INTO public.shift_options (
        name,
        start_time,
        end_time,
        duration_hours,
        category
    )
    VALUES (
        'Test Day Shift',
        '09:00'::time,
        '19:00'::time,
        10,
        'day'
    )
    RETURNING id INTO v_shift_option_id;
    
    RAISE NOTICE 'Test data setup completed successfully';
    RAISE NOTICE 'Employee ID: %, Supervisor ID: %, Schedule Period ID: %, Shift Option ID: %',
                 v_employee_id, v_supervisor_id, v_schedule_period_id, v_shift_option_id;
    
    RETURN QUERY SELECT v_employee_id, v_supervisor_id, v_schedule_period_id, v_shift_option_id;
END;
$$ LANGUAGE plpgsql; 