-- Create test schema
CREATE SCHEMA IF NOT EXISTS tests;

-- Grant usage on test schema to authenticated users
GRANT USAGE ON SCHEMA tests TO authenticated;

-- Drop existing functions to prevent duplicates
DROP FUNCTION IF EXISTS tests.create_supabase_user(text);
DROP FUNCTION IF EXISTS tests.get_supabase_uid(text);
DROP FUNCTION IF EXISTS tests.cleanup_test_data();

-- Function to create a test Supabase user
CREATE OR REPLACE FUNCTION tests.create_supabase_user(email text)
RETURNS uuid AS $$
DECLARE
    user_id uuid;
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
        email,
        '$2a$10$2nqyqX9ZGKe4c8KXqLuHhOGwNyqX9ZGKe4c8KXqLuHhO',
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    ) RETURNING id INTO user_id;

    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute on test functions to authenticated users
GRANT EXECUTE ON FUNCTION tests.create_supabase_user(text) TO authenticated;

-- Function to get a Supabase user's ID by email
CREATE OR REPLACE FUNCTION tests.get_supabase_uid(email text)
RETURNS uuid AS $$
DECLARE
    user_id uuid;
BEGIN
    SELECT id INTO user_id
    FROM auth.users
    WHERE auth.users.email = get_supabase_uid.email;
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION tests.get_supabase_uid(text) TO authenticated;

-- Function to clean up test data
CREATE OR REPLACE FUNCTION tests.cleanup_test_data()
RETURNS void AS $$
BEGIN
    -- Clean up data in reverse dependency order
    DELETE FROM public.individual_shifts;
    DELETE FROM public.time_off_requests;
    DELETE FROM public.staffing_requirements;
    DELETE FROM public.schedule_periods;
    DELETE FROM public.shifts;
    DELETE FROM public.shift_options;
    DELETE FROM public.employees;
    DELETE FROM public.teams;
    DELETE FROM auth.users;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION tests.cleanup_test_data() TO authenticated; 