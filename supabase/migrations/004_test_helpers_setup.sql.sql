-- 004_test_helpers_setup.sql
--
-- This migration sets up the test helper environment:
--  - Creates (if not exists) the test_helpers schema.
--  - Defines utility functions for:
--    - Cleaning test data
--    - Setting auth contexts
--    - Creating test users

CREATE SCHEMA IF NOT EXISTS test_helpers;

-- Test data table and policies
CREATE TABLE IF NOT EXISTS public.test_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    schedule_period_id uuid REFERENCES public.schedule_periods(id),
    employee_id uuid REFERENCES public.employees(id),
    shift_option_id uuid REFERENCES public.shift_options(id)
);

-- For testing: override auth.uid()
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$;

-- Function: set_auth_user for testing
CREATE OR REPLACE FUNCTION test_helpers.set_auth_user(user_id text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
END;
$$;

-- Function: clean_test_data (drops test-related records)
CREATE OR REPLACE FUNCTION test_helpers.clean_test_data()
RETURNS void AS $$
BEGIN
    SET session_replication_role = 'replica';
    DELETE FROM public.shift_swap_requests;
    DELETE FROM public.shift_assignment_scores;
    DELETE FROM public.scheduling_logs;
    DELETE FROM public.individual_shifts;
    DELETE FROM public.time_off_requests;
    DELETE FROM public.shift_options WHERE name LIKE 'Test%';
    DELETE FROM public.schedule_periods;
    UPDATE public.employees SET created_by = NULL;
    DELETE FROM public.employees;
    DELETE FROM public.profiles;
    DELETE FROM auth.users;
    DELETE FROM public.test_data;
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_schema = 'public') THEN
        ALTER SEQUENCE IF EXISTS public.employees_id_seq RESTART;
        ALTER SEQUENCE IF EXISTS public.profiles_id_seq RESTART;
        ALTER SEQUENCE IF EXISTS public.shift_options_id_seq RESTART;
        ALTER SEQUENCE IF EXISTS public.schedule_periods_id_seq RESTART;
    END IF;
    SET session_replication_role = 'origin';
    RAISE NOTICE 'Test data cleanup completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Function: clean_test_user for a specific test user
CREATE OR REPLACE FUNCTION test_helpers.clean_test_user(p_email text)
RETURNS void AS $$
DECLARE
    v_auth_id uuid;
    v_employee_id uuid;
BEGIN
    SELECT e.auth_id, e.id INTO v_auth_id, v_employee_id
    FROM public.employees e
    WHERE e.email = p_email;
    IF v_auth_id IS NULL THEN
        SELECT p.id INTO v_auth_id FROM public.profiles p WHERE p.email = p_email;
        IF v_auth_id IS NULL THEN
            SELECT u.id INTO v_auth_id FROM auth.users u WHERE u.email = p_email;
        END IF;
    END IF;
    IF v_auth_id IS NULL THEN
        RETURN;
    END IF;
    DELETE FROM public.shift_swap_requests WHERE employee_id = v_employee_id;
    DELETE FROM public.individual_shifts WHERE employee_id = v_employee_id;
    DELETE FROM public.time_off_requests WHERE employee_id = v_employee_id;
    UPDATE public.test_data SET employee_id = NULL WHERE employee_id = v_employee_id;
    UPDATE public.employees SET created_by = NULL WHERE created_by = v_auth_id;
    DELETE FROM public.employees WHERE id = v_employee_id;
    DELETE FROM public.profiles WHERE id = v_auth_id;
    DELETE FROM auth.users WHERE id = v_auth_id;
END;
$$ LANGUAGE plpgsql;

-- Function: create_test_user for creating new test users
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
    IF p_suffix = '' THEN
        v_email:= p_email;
    ELSE
        v_email:= replace(p_email, '@', '_' || p_suffix || '@');
    END IF;
    PERFORM test_helpers.clean_test_user(v_email);
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
    
    INSERT INTO public.profiles (id, email, role)
    VALUES (v_auth_id, v_email, p_role);
    
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

-- Function: setup_test_data to create a complete test record
CREATE OR REPLACE FUNCTION test_helpers.setup_test_data()
RETURNS public.test_data AS $$
DECLARE
    test_record public.test_data;
    v_schedule_period_id uuid;
    v_auth_id uuid;
    v_employee_id uuid;
    v_shift_option_id uuid;
BEGIN
    PERFORM test_helpers.clean_test_data();
    INSERT INTO public.schedule_periods (start_date, end_date)
    VALUES (CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days')
    RETURNING id INTO v_schedule_period_id;
    SELECT * INTO v_auth_id, v_employee_id
    FROM test_helpers.create_test_user('test@example.com', 'dispatcher');
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

ALTER TABLE public.test_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "test_data_restricted" ON public.test_data
    FOR ALL USING (false);

-- Helper function to check if we're in a development environment
CREATE OR REPLACE FUNCTION public.is_development()
RETURNS boolean 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN current_setting('app.settings.environment', true) = 'development';
END;
$$;

-- Allow test data access in development
CREATE POLICY "test_data_development" ON public.test_data
    FOR ALL USING (is_development());