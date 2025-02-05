BEGIN;

-- Create test schema
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS test_helpers;

-- Drop existing test data
DROP TABLE IF EXISTS public.test_data CASCADE;

-- Create test data table
CREATE TABLE IF NOT EXISTS public.test_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create roles enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employee_role') THEN
        CREATE TYPE employee_role AS ENUM ('dispatcher', 'supervisor', 'manager');
    END IF;
END$$;

-- Create test roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create or replace auth.uid() function
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$;

-- Create or replace set_auth_user function
CREATE OR REPLACE FUNCTION test_helpers.set_auth_user(user_id text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
END;
$$;

-- Create or replace clean_test_data function
CREATE OR REPLACE FUNCTION test_helpers.clean_test_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete data in reverse order of dependencies
    DELETE FROM public.shift_swap_requests;
    DELETE FROM public.time_off_requests;
    DELETE FROM public.schedules;
    DELETE FROM public.employees;
    DELETE FROM auth.users;
    DELETE FROM public.test_data;
END;
$$;

-- Create or replace setup_test_data function
CREATE OR REPLACE FUNCTION test_helpers.setup_test_data()
RETURNS public.test_data
LANGUAGE plpgsql
AS $$
DECLARE
    test_record public.test_data;
BEGIN
    -- Clean up any existing test data
    PERFORM test_helpers.clean_test_data();
    
    -- Create new test data
    INSERT INTO public.test_data DEFAULT VALUES
    RETURNING * INTO test_record;
    
    RETURN test_record;
END;
$$;

-- Run initial cleanup
SELECT test_helpers.clean_test_data();

COMMIT; 