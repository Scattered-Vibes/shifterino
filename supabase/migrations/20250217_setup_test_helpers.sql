-- Create test helpers schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS test_helpers;

-- Drop only our test helper functions
DROP FUNCTION IF EXISTS test_helpers.setup_test_data();
DROP FUNCTION IF EXISTS test_helpers.set_auth_user(text);
DROP FUNCTION IF EXISTS test_helpers.clean_test_data();
DROP FUNCTION IF EXISTS test_helpers.create_test_user(text, text, text);
DROP FUNCTION IF EXISTS test_helpers.clean_test_user(text);

-- Create function to set auth user for testing
CREATE OR REPLACE FUNCTION test_helpers.set_auth_user(p_email text)
RETURNS void AS $$
BEGIN
    -- Set auth.uid() to the user's auth.users.id
    PERFORM set_config('request.jwt.claim.sub', (
        SELECT id::text 
        FROM auth.users 
        WHERE email = p_email
    ), true);
END;
$$ LANGUAGE plpgsql;

-- Create function to clean test data
CREATE OR REPLACE FUNCTION test_helpers.clean_test_data()
RETURNS void AS $$
BEGIN
    -- Disable triggers temporarily to avoid side effects during cleanup
    SET session_replication_role = 'replica';
    
    -- Delete all test data in the correct order to respect foreign key constraints
    DELETE FROM public.shift_swap_requests;
    DELETE FROM public.shift_assignment_scores;
    DELETE FROM public.scheduling_logs;
    DELETE FROM public.individual_shifts;
    DELETE FROM public.time_off_requests;
    DELETE FROM public.shift_options WHERE name LIKE 'Test%';
    DELETE FROM public.schedule_periods;
    
    -- Update any records that reference users as created_by to NULL
    UPDATE public.employees SET created_by = NULL;
    
    -- Delete all employees, profiles, and users
    DELETE FROM public.employees;
    DELETE FROM public.profiles;
    DELETE FROM auth.users;
    
    -- Delete test data table records if they exist
    DELETE FROM public.test_data;
    
    -- Reset sequences if they exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_schema = 'public') THEN
        ALTER SEQUENCE IF EXISTS public.employees_id_seq RESTART;
        ALTER SEQUENCE IF EXISTS public.profiles_id_seq RESTART;
        ALTER SEQUENCE IF EXISTS public.shift_options_id_seq RESTART;
        ALTER SEQUENCE IF EXISTS public.schedule_periods_id_seq RESTART;
    END IF;
    
    -- Re-enable triggers
    SET session_replication_role = 'origin';
END;
$$ LANGUAGE plpgsql;

-- Create function to clean specific test user
CREATE OR REPLACE FUNCTION test_helpers.clean_test_user(p_email text)
RETURNS void AS $$
BEGIN
    -- Disable triggers temporarily
    SET session_replication_role = 'replica';
    
    -- Delete all related records
    DELETE FROM public.shift_swap_requests
    WHERE shift_id IN (
        SELECT id FROM public.individual_shifts 
        WHERE employee_id IN (SELECT id FROM public.employees WHERE email = p_email)
    );
    
    DELETE FROM public.shift_assignment_scores
    WHERE shift_id IN (
        SELECT id FROM public.individual_shifts 
        WHERE employee_id IN (SELECT id FROM public.employees WHERE email = p_email)
    );
    
    DELETE FROM public.scheduling_logs
    WHERE related_employee_id IN (SELECT id FROM public.employees WHERE email = p_email);
    
    DELETE FROM public.individual_shifts
    WHERE employee_id IN (SELECT id FROM public.employees WHERE email = p_email);
    
    DELETE FROM public.time_off_requests
    WHERE employee_id IN (SELECT id FROM public.employees WHERE email = p_email);
    
    -- Update any records that reference this user as created_by to NULL
    UPDATE public.employees
    SET created_by = NULL
    WHERE created_by IN (SELECT auth_id FROM public.employees WHERE email = p_email);
    
    -- Delete employee, profile, and auth user
    DELETE FROM public.employees WHERE email = p_email;
    DELETE FROM public.profiles WHERE email = p_email;
    DELETE FROM auth.users WHERE email = p_email;
    
    -- Re-enable triggers
    SET session_replication_role = 'origin';
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
    
    -- Create profile
    INSERT INTO public.profiles (id, email, role)
    VALUES (v_auth_id, v_email, p_role);
    
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
    
    RETURN QUERY SELECT v_auth_id, v_employee_id;
END;
$$ LANGUAGE plpgsql; 