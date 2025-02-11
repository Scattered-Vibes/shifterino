-- Create test schema
CREATE SCHEMA IF NOT EXISTS tests;

-- Function to create a test Supabase user
CREATE OR REPLACE FUNCTION tests.create_supabase_user(email text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    user_id uuid;
BEGIN
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
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        email,
        '$2a$10$2nqyHhXImqPBVVrBOj7V8.Y4A.P.p6YlRuZV3zRVqwMQYAYtFU.Gy', -- test123
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO user_id;

    RETURN user_id;
END;
$$;

-- Function to get a test user's ID
CREATE OR REPLACE FUNCTION tests.get_supabase_uid(email text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    user_id uuid;
BEGIN
    SELECT id INTO user_id
    FROM auth.users
    WHERE auth.users.email = $1
    LIMIT 1;

    RETURN user_id;
END;
$$;

-- Function to clean up test data
CREATE OR REPLACE FUNCTION tests.cleanup_test_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Clean up test users
    DELETE FROM auth.users 
    WHERE email LIKE 'test.%@example.com';

    -- Clean up test employees
    DELETE FROM public.employees 
    WHERE email LIKE 'test.%@example.com';

    -- Clean up test schedules
    DELETE FROM public.schedules 
    WHERE id IN ('55555555-5555-5555-5555-555555555555', '88888888-8888-8888-8888-888888888888');

    -- Clean up test time off requests
    DELETE FROM public.time_off_requests 
    WHERE id IN ('99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

    -- Clean up audit logs for test data
    DELETE FROM public.audit_logs 
    WHERE changed_by IN (SELECT id FROM auth.users WHERE email LIKE 'test.%@example.com');
END;
$$; 