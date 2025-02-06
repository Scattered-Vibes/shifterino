-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS test_helpers.clean_test_data();
DROP FUNCTION IF EXISTS test_helpers.create_test_user(text, text, text);
DROP FUNCTION IF EXISTS test_helpers.clean_test_user(text);

-- Create function to clean test data
CREATE OR REPLACE FUNCTION test_helpers.clean_test_data()
RETURNS void AS $$
DECLARE
    v_count int;
BEGIN
    -- Disable triggers temporarily to avoid side effects during cleanup
    SET session_replication_role = 'replica';
    
    -- Start with the most dependent tables first
    -- 1. Shift-related tables
    DELETE FROM public.shift_swap_requests;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from shift_swap_requests', v_count;
    
    DELETE FROM public.shift_assignment_scores;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from shift_assignment_scores', v_count;
    
    DELETE FROM public.scheduling_logs;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from scheduling_logs', v_count;
    
    DELETE FROM public.individual_shifts;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from individual_shifts', v_count;
    
    -- 2. Time off and schedule-related tables
    DELETE FROM public.time_off_requests;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from time_off_requests', v_count;
    
    DELETE FROM public.shift_options WHERE name LIKE 'Test%';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from shift_options', v_count;
    
    DELETE FROM public.schedule_periods;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from schedule_periods', v_count;
    
    -- 3. Handle created_by references
    UPDATE public.employees SET created_by = NULL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Updated % rows in employees (created_by to NULL)', v_count;
    
    -- 4. Delete user-related data
    DELETE FROM public.employees;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from employees', v_count;
    
    DELETE FROM public.profiles;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from profiles', v_count;
    
    DELETE FROM auth.users;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from auth.users', v_count;
    
    -- 5. Clean up test data table if it exists
    DELETE FROM public.test_data;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from test_data', v_count;
    
    -- 6. Reset sequences if they exist
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
BEGIN
    -- Get auth_id for the user if they exist
    SELECT auth_id INTO v_auth_id
    FROM public.employees
    WHERE email = p_email;
    
    -- If user doesn't exist, log and return
    IF v_auth_id IS NULL THEN
        RAISE NOTICE 'No user found with email: %', p_email;
        RETURN;
    END IF;
    
    -- Disable triggers temporarily
    SET session_replication_role = 'replica';
    
    -- Delete all related records
    DELETE FROM public.shift_swap_requests
    WHERE shift_id IN (
        SELECT id FROM public.individual_shifts 
        WHERE employee_id IN (SELECT id FROM public.employees WHERE email = p_email)
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from shift_swap_requests for user %', v_count, p_email;
    
    DELETE FROM public.shift_assignment_scores
    WHERE shift_id IN (
        SELECT id FROM public.individual_shifts 
        WHERE employee_id IN (SELECT id FROM public.employees WHERE email = p_email)
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from shift_assignment_scores for user %', v_count, p_email;
    
    DELETE FROM public.scheduling_logs
    WHERE related_employee_id IN (SELECT id FROM public.employees WHERE email = p_email);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from scheduling_logs for user %', v_count, p_email;
    
    DELETE FROM public.individual_shifts
    WHERE employee_id IN (SELECT id FROM public.employees WHERE email = p_email);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from individual_shifts for user %', v_count, p_email;
    
    DELETE FROM public.time_off_requests
    WHERE employee_id IN (SELECT id FROM public.employees WHERE email = p_email);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from time_off_requests for user %', v_count, p_email;
    
    -- Update any records that reference this user as created_by to NULL
    UPDATE public.employees
    SET created_by = NULL
    WHERE created_by = v_auth_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Updated % rows in employees (created_by to NULL) for user %', v_count, p_email;
    
    -- Delete employee, profile, and auth user
    DELETE FROM public.employees WHERE email = p_email;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from employees for user %', v_count, p_email;
    
    DELETE FROM public.profiles WHERE email = p_email;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from profiles for user %', v_count, p_email;
    
    DELETE FROM auth.users WHERE email = p_email;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from auth.users for user %', v_count, p_email;
    
    -- Re-enable triggers
    SET session_replication_role = 'origin';
    RAISE NOTICE 'Cleanup completed for user %', p_email;
END;
$$ LANGUAGE plpgsql;

-- Create function to create test user
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
    -- Generate unique email
    IF p_suffix = '' THEN
        v_email := p_email;
    ELSE
        v_email := replace(p_email, '@', '_' || p_suffix || '@');
    END IF;
    
    RAISE NOTICE 'Creating test user with email: %', v_email;
    
    -- Clean up any existing test user
    PERFORM test_helpers.clean_test_user(v_email);
    
    -- Create new user
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
        'User',
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
$$ LANGUAGE plpgsql; 