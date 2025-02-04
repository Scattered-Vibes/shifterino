-- Create test_helpers schema
CREATE SCHEMA IF NOT EXISTS test_helpers;

-- Create clean_test_data function
CREATE OR REPLACE FUNCTION test_helpers.clean_test_data()
RETURNS void AS $$
BEGIN
    -- Delete test data from tables in reverse order of dependencies
    DELETE FROM public.shift_swap_requests WHERE shift_id IN (
        SELECT id FROM public.individual_shifts WHERE schedule_period_id IN (
            SELECT id FROM public.schedule_periods WHERE created_at >= CURRENT_DATE
        )
    );
    DELETE FROM public.scheduling_logs WHERE schedule_period_id IN (
        SELECT id FROM public.schedule_periods WHERE created_at >= CURRENT_DATE
    );
    DELETE FROM public.individual_shifts WHERE schedule_period_id IN (
        SELECT id FROM public.schedule_periods WHERE created_at >= CURRENT_DATE
    );
    DELETE FROM public.time_off_requests WHERE employee_id IN (
        SELECT id FROM public.employees WHERE email LIKE '%@test.com'
    );
    DELETE FROM public.shift_options WHERE name LIKE 'Test%';
    DELETE FROM public.schedule_periods WHERE created_at >= CURRENT_DATE;
    DELETE FROM public.employees WHERE email LIKE '%@test.com';
    DELETE FROM public.profiles WHERE email LIKE '%@test.com';
    DELETE FROM auth.users WHERE email LIKE '%@test.com';
END;
$$ LANGUAGE plpgsql;

-- Create set_auth_user function
CREATE OR REPLACE FUNCTION test_helpers.set_auth_user(p_user_id uuid, p_role text)
RETURNS void AS $$
BEGIN
    -- Set session variables for RLS
    PERFORM set_config('request.jwt.claim.sub', COALESCE(p_user_id::text, ''), true);
    PERFORM set_config('request.jwt.claim.role', p_role, true);
END;
$$ LANGUAGE plpgsql;

-- Create test user function
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

    -- Temporarily disable the on_auth_user_created trigger
    ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

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
    
    -- Re-enable the on_auth_user_created trigger
    ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
    
    RETURN QUERY SELECT v_auth_id, v_employee_id;
END;
$$ LANGUAGE plpgsql; 