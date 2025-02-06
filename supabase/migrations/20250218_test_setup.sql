-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS test_helpers.setup_test_data();
DROP FUNCTION IF EXISTS test_helpers.set_auth_user(text);

-- Create test schema and tables
CREATE SCHEMA IF NOT EXISTS test_helpers;

-- Create test data table
CREATE TABLE IF NOT EXISTS public.test_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create or replace auth.uid() function for testing
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$;

-- Create or replace set_auth_user function for testing
CREATE OR REPLACE FUNCTION test_helpers.set_auth_user(user_id text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
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