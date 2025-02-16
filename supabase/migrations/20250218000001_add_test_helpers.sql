-- Create test schema
CREATE SCHEMA IF NOT EXISTS tests;

-- Create function to generate salt for password hashing
CREATE OR REPLACE FUNCTION tests.gen_salt(text)
RETURNS text AS $$
BEGIN
    -- For testing purposes, we'll return a fixed salt
    RETURN 'test_salt';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to hash passwords
CREATE OR REPLACE FUNCTION tests.crypt(password text, salt text)
RETURNS text AS $$
BEGIN
    -- For testing purposes, we'll return a simple hash
    RETURN 'test_hash_' || password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a test user and return the auth_id
CREATE OR REPLACE FUNCTION tests.create_supabase_user(
    p_email text,
    p_first_name text,
    p_last_name text,
    p_role text,
    p_shift_pattern text,
    p_password text
)
RETURNS uuid AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Insert into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        p_email,
        tests.crypt(p_password, tests.gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
        jsonb_build_object(
            'first_name', p_first_name,
            'last_name', p_last_name,
            'role', p_role,
            'shift_pattern', p_shift_pattern
        ),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO v_user_id;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup test data
CREATE OR REPLACE FUNCTION tests.cleanup_test_data()
RETURNS void AS $$
BEGIN
    -- Delete test users and their related data
    DELETE FROM auth.users WHERE email LIKE 'test.%@example.com';
    DELETE FROM public.employees WHERE email LIKE 'test.%@example.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA tests TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION tests.create_supabase_user TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION tests.cleanup_test_data TO authenticated, anon, service_role; 