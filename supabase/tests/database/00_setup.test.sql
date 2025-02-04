BEGIN;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS test_helpers;

-- Create mock auth.users table
DROP TABLE IF EXISTS auth.users CASCADE;
CREATE TABLE auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id uuid,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    phone text DEFAULT NULL::text,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::text,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false,
    deleted_at timestamp with time zone
);

-- Create mock auth.roles table
DROP TABLE IF EXISTS auth.roles CASCADE;
CREATE TABLE auth.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name character varying(255) UNIQUE
);

-- Insert default roles
INSERT INTO auth.roles (name) VALUES
    ('anon'),
    ('authenticated'),
    ('service_role')
ON CONFLICT (name) DO NOTHING;

-- Create function to get current user id (mock auth.uid())
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
BEGIN
    RETURN nullif(current_setting('app.current_user_id', TRUE), '')::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL::uuid;
END;
$$ LANGUAGE plpgsql;

-- Create function to get current user role (mock auth.role())
CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
BEGIN
    RETURN nullif(current_setting('app.current_user_role', TRUE), '')::text;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL::text;
END;
$$ LANGUAGE plpgsql;

-- Function to set the current user context for testing
CREATE OR REPLACE FUNCTION test_helpers.set_auth_user(user_id uuid, user_role text) RETURNS void AS $$
BEGIN
    IF user_id IS NULL THEN
        PERFORM set_config('app.current_user_id', '', TRUE);
    ELSE
        PERFORM set_config('app.current_user_id', user_id::text, TRUE);
    END IF;
    
    IF user_role IS NULL THEN
        PERFORM set_config('app.current_user_role', '', TRUE);
    ELSE
        PERFORM set_config('app.current_user_role', user_role, TRUE);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to clean test data
CREATE OR REPLACE FUNCTION test_helpers.clean_test_data() RETURNS void AS $$
BEGIN
    DELETE FROM public.shift_assignment_scores;
    DELETE FROM public.scheduling_logs;
    DELETE FROM public.shift_swap_requests;
    DELETE FROM public.time_off_requests;
    DELETE FROM public.individual_shifts;
    DELETE FROM public.shift_options;
    DELETE FROM public.schedule_periods;
    DELETE FROM public.employees;
    DELETE FROM public.profiles;
    DELETE FROM auth.users;
END;
$$ LANGUAGE plpgsql;

-- Function to create a test user
CREATE OR REPLACE FUNCTION test_helpers.create_test_user(
    email text,
    role text,
    unique_suffix text DEFAULT ''
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
    IF unique_suffix = '' THEN
        v_email := email;
    ELSE
        v_email := replace(email, '@', '_' || unique_suffix || '@');
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
        role,
        'test-password',
        jsonb_build_object('role', role),
        NOW(),
        NOW()
    )
    RETURNING id INTO v_auth_id;
    
    -- Insert profile
    INSERT INTO public.profiles (id, email, role)
    VALUES (v_auth_id, v_email, role);
    
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
        role::employee_role,
        'pattern_a'
    )
    RETURNING id INTO v_employee_id;
    
    RETURN QUERY SELECT v_auth_id, v_employee_id;
END;
$$ LANGUAGE plpgsql;

COMMIT; 