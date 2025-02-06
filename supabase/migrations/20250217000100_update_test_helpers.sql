-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS test_helpers.setup_test_data();
DROP FUNCTION IF EXISTS test_helpers.set_auth_user(text);
DROP FUNCTION IF EXISTS test_helpers.clean_test_data();
DROP FUNCTION IF EXISTS test_helpers.create_test_user(text, text);
DROP FUNCTION IF EXISTS test_helpers.create_test_user(text, text, text);
DROP FUNCTION IF EXISTS test_helpers.clean_test_user(text);

-- Create test schema and tables
CREATE SCHEMA IF NOT EXISTS test_helpers;

-- Create test data table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.test_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    schedule_period_id uuid REFERENCES public.schedule_periods(id),
    employee_id uuid REFERENCES public.employees(id),
    shift_option_id uuid REFERENCES public.shift_options(id)
);

-- Create function to clean test data
CREATE OR REPLACE FUNCTION test_helpers.clean_test_data()
RETURNS void AS $$
BEGIN
    -- Disable triggers temporarily to avoid side effects during cleanup
    SET session_replication_role = 'replica';
    
    -- Delete data in reverse order of dependencies
    DELETE FROM public.shift_swap_requests;
    DELETE FROM public.shift_assignment_scores;
    DELETE FROM public.scheduling_logs;
    DELETE FROM public.individual_shifts;
    DELETE FROM public.time_off_requests;
    
    -- Update test_data to remove references
    UPDATE public.test_data 
    SET schedule_period_id = NULL, 
        employee_id = NULL,
        shift_option_id = NULL;
    
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
    
    RAISE NOTICE 'Test data cleanup completed successfully';
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
    
    -- Create new user in auth.users
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
        split_part(p_role, '@', 1),
        v_email,
        p_role::employee_role,
        'pattern_a',
        40,
        v_auth_id
    )
    RETURNING id INTO v_employee_id;
    
    RETURN QUERY SELECT v_auth_id, v_employee_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean specific test user
CREATE OR REPLACE FUNCTION test_helpers.clean_test_user(p_email text)
RETURNS void AS $$
DECLARE
    v_auth_id uuid;
    v_employee_id uuid;
BEGIN
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
    
    -- If no user found anywhere, return
    IF v_auth_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Delete in reverse order of dependencies
    DELETE FROM public.shift_swap_requests WHERE employee_id = v_employee_id;
    DELETE FROM public.individual_shifts WHERE employee_id = v_employee_id;
    DELETE FROM public.time_off_requests WHERE employee_id = v_employee_id;
    
    -- Update test_data to remove employee reference
    UPDATE public.test_data SET employee_id = NULL WHERE employee_id = v_employee_id;
    
    -- Update any records that reference this user as created_by to NULL
    UPDATE public.employees SET created_by = NULL WHERE created_by = v_auth_id;
    
    -- Delete employee record
    DELETE FROM public.employees WHERE id = v_employee_id;
    
    -- Delete profile and auth user
    DELETE FROM public.profiles WHERE id = v_auth_id;
    DELETE FROM auth.users WHERE id = v_auth_id;
END;
$$ LANGUAGE plpgsql;

-- Create setup_test_data function
CREATE OR REPLACE FUNCTION test_helpers.setup_test_data()
RETURNS public.test_data AS $$
DECLARE
    test_record public.test_data;
    v_schedule_period_id uuid;
    v_auth_id uuid;
    v_employee_id uuid;
    v_shift_option_id uuid;
BEGIN
    -- Clean up any existing test data
    PERFORM test_helpers.clean_test_data();
    
    -- Create test schedule period
    INSERT INTO public.schedule_periods (start_date, end_date)
    VALUES (CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days')
    RETURNING id INTO v_schedule_period_id;
    
    -- Create test user
    SELECT * INTO v_auth_id, v_employee_id
    FROM test_helpers.create_test_user('test@example.com', 'dispatcher');
    
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
    
    -- Create test individual shift
    INSERT INTO public.individual_shifts (
        employee_id,
        shift_option_id,
        schedule_period_id,
        date,
        status
    )
    VALUES (
        v_employee_id,
        v_shift_option_id,
        v_schedule_period_id,
        CURRENT_DATE,
        'scheduled'
    );
    
    -- Create new test data record
    INSERT INTO public.test_data (
        schedule_period_id,
        employee_id,
        shift_option_id
    )
    VALUES (
        v_schedule_period_id,
        v_employee_id,
        v_shift_option_id
    )
    RETURNING * INTO test_record;
    
    RAISE NOTICE 'Created test data record with id: %, schedule_period_id: %, employee_id: %, shift_option_id: %',
                 test_record.id,
                 test_record.schedule_period_id,
                 test_record.employee_id,
                 test_record.shift_option_id;
    
    RETURN test_record;
END;
$$ LANGUAGE plpgsql; 