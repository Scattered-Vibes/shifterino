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
    -- Clean up test time off requests
    DELETE FROM public.time_off_requests 
    WHERE employee_id IN (
        SELECT id FROM public.employees 
        WHERE email LIKE 'test.%@example.com'
    );

    -- Clean up test assigned shifts
    DELETE FROM public.assigned_shifts 
    WHERE employee_id IN (
        SELECT id FROM public.employees 
        WHERE email LIKE 'test.%@example.com'
    );

    -- Clean up test employees
    DELETE FROM public.employees 
    WHERE email LIKE 'test.%@example.com';

    -- Clean up test users
    DELETE FROM auth.users 
    WHERE email LIKE 'test.%@example.com';

    -- Clean up test teams
    DELETE FROM public.teams 
    WHERE name LIKE 'Team %';

    -- Clean up test shifts
    DELETE FROM public.shifts 
    WHERE name LIKE 'Test %';
END;
$$; 