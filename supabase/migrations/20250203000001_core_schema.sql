--
-- Core Schema Migration
-- Combines auth setup and initial schema
--

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Set search path
SET search_path TO public, auth, extensions;

-- Create roles if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
        CREATE ROLE authenticator NOINHERIT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role;
    END IF;
END
$$;

-- Drop existing tables and types if they exist
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.employee_role CASCADE;
DROP TYPE IF EXISTS public.shift_pattern CASCADE;
DROP TYPE IF EXISTS public.shift_category CASCADE;
DROP TYPE IF EXISTS public.time_off_status CASCADE;
DROP TYPE IF EXISTS public.shift_status CASCADE;
DROP TYPE IF EXISTS public.log_severity CASCADE;

-- Create all enum types
DO $$ BEGIN
    CREATE TYPE public.employee_role AS ENUM ('dispatcher', 'supervisor', 'manager');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.shift_pattern AS ENUM ('pattern_a', 'pattern_b', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.shift_category AS ENUM ('early', 'day', 'swing', 'graveyard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.time_off_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.shift_status AS ENUM ('scheduled', 'in_progress', 'completed', 'missed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.log_severity AS ENUM ('info', 'warning', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_role CHECK (role IN ('dispatcher', 'supervisor', 'manager'))
);

-- Create employees table
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role public.employee_role NOT NULL,
    shift_pattern public.shift_pattern NOT NULL,
    preferred_shift_category public.shift_category,
    weekly_hours_cap INTEGER NOT NULL DEFAULT 40,
    max_overtime_hours INTEGER DEFAULT 0,
    last_shift_date DATE,
    total_hours_current_week INTEGER DEFAULT 0,
    consecutive_shifts_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user can create users with specific roles
CREATE OR REPLACE FUNCTION can_create_user_with_role(creator_id UUID, new_role employee_role)
RETURNS BOOLEAN AS $$
DECLARE
    creator_role employee_role;
BEGIN
    -- Get the role of the creator
    SELECT role::employee_role INTO creator_role
    FROM profiles
    WHERE id = creator_id;

    -- Only managers can create supervisors
    IF new_role = 'supervisor' AND creator_role != 'manager' THEN
        RETURN FALSE;
    END IF;

    -- Only managers and supervisors can create dispatchers
    IF new_role = 'dispatcher' AND creator_role NOT IN ('manager', 'supervisor') THEN
        RETURN FALSE;
    END IF;

    -- Only the system can create managers (handled separately in initial setup)
    IF new_role = 'manager' THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create auth handling function with role validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_role employee_role;
    v_email text;
    v_user_id uuid;
    v_creator_id uuid;
    v_first_name text;
    v_last_name text;
BEGIN
    -- Get user data
    v_user_id := NEW.id;
    v_email := NEW.email;
    v_creator_id := NEW.raw_user_meta_data->>'created_by';
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    
    -- Get and validate role with a safe default
    BEGIN
        v_role := (NEW.raw_user_meta_data->>'role')::employee_role;
    EXCEPTION WHEN OTHERS THEN
        v_role := 'dispatcher'::employee_role;
    END;

    -- Validate role creation permissions
    IF v_creator_id IS NOT NULL AND NOT can_create_user_with_role(v_creator_id, v_role) THEN
        RAISE EXCEPTION 'Unauthorized to create user with role %', v_role;
    END IF;

    -- Create profile
    INSERT INTO profiles (id, email, role, is_email_verified)
    VALUES (v_user_id, v_email, v_role::text, COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE));

    -- Create employee record
    INSERT INTO employees (
        auth_id,
        first_name,
        last_name,
        email,
        role,
        shift_pattern,
        created_by
    )
    VALUES (
        v_user_id,
        v_first_name,
        v_last_name,
        v_email,
        v_role,
        CASE 
            WHEN v_role = 'supervisor' THEN 'pattern_a'::shift_pattern
            ELSE 'pattern_b'::shift_pattern
        END,
        v_creator_id
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for new user handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Supervisors and managers can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('supervisor', 'manager')
        )
    );

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "View own employee record"
    ON employees FOR SELECT
    USING (auth_id = auth.uid());

CREATE POLICY "Supervisors and managers can view all employees"
    ON employees FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('supervisor', 'manager')
        )
    );

CREATE POLICY "Managers can update all employees"
    ON employees FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'manager'
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;

-- Allow public access to auth schema
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO anon, authenticated, service_role;

-- Create trigger to validate email matches auth user
CREATE OR REPLACE FUNCTION validate_employee_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email != (SELECT email FROM auth.users WHERE id = NEW.auth_id) THEN
        RAISE EXCEPTION 'Employee email must match auth user email';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_employee_email_trigger
    BEFORE INSERT OR UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION validate_employee_email(); 