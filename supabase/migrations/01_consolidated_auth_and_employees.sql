-- 01_consolidated_auth_and_employees.sql
-- This file consolidates the core authentication, employee, and related permission setup.
-- It merges the logic from the original 01_core_auth.sql, 03_fix_auth_permissions.sql,
-- 04_additional_auth_fixes.sql, 05_auth_schema_fix.sql, and 20250205_init.sql.
-- Run this migration before the scheduling system migration.

-- Section 1: Core Authentication Setup
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER ROLE authenticator SET search_path TO public, auth, extensions;
ALTER DATABASE postgres SET search_path TO public, auth, extensions;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
      CREATE ROLE authenticator NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      CREATE ROLE anon;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      CREATE ROLE authenticated;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
      CREATE ROLE service_role;
  END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS auth;

DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS auth.users CASCADE;
DROP TYPE IF EXISTS public.employee_role CASCADE;
DROP TYPE IF EXISTS public.shift_pattern CASCADE;
DROP TYPE IF EXISTS public.shift_category CASCADE;
DROP TYPE IF EXISTS public.time_off_status CASCADE;
DROP TYPE IF EXISTS public.shift_status CASCADE;
DROP TYPE IF EXISTS public.log_severity CASCADE;

DO $$ BEGIN
    CREATE TYPE public.employee_role AS ENUM ('dispatcher', 'supervisor', 'manager');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    CREATE TYPE public.shift_pattern AS ENUM ('pattern_a', 'pattern_b', 'custom');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    CREATE TYPE public.shift_category AS ENUM ('early', 'day', 'swing', 'graveyard');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    CREATE TYPE public.time_off_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    CREATE TYPE public.shift_status AS ENUM ('scheduled', 'in_progress', 'completed', 'missed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    CREATE TYPE public.log_severity AS ENUM ('info', 'warning', 'error');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create auth.users table
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
    phone text DEFAULT NULL,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT '',
    phone_change_token character varying(255) DEFAULT '',
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone,
    email_change_token_current character varying(255) DEFAULT '',
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT '',
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false,
    deleted_at timestamp with time zone,
    is_anonymous BOOLEAN DEFAULT false,
    factors INTEGER DEFAULT 0
);

-- Create public.profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_role CHECK (role IN ('dispatcher', 'supervisor', 'manager'))
);

-- Create public.employees table
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

-- Trigger function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Email validation for employees
CREATE OR REPLACE FUNCTION public.validate_employee_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format: %', NEW.email;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER validate_employee_email_trigger
    BEFORE INSERT OR UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_employee_email();

-- New User Handling Function and Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth, extensions
LANGUAGE plpgsql
AS $$
DECLARE
    v_role public.employee_role;
    v_email TEXT;
    v_user_id UUID;
    v_creator_id UUID;
    v_first_name TEXT;
    v_last_name TEXT;
    v_raw_role TEXT;
BEGIN
    -- Input validation
    IF NEW.raw_user_meta_data IS NULL THEN
        RAISE WARNING 'Raw user metadata is null for user %', NEW.id;
        NEW.raw_user_meta_data := '{}'::jsonb;
    END IF;

    IF NEW.email IS NULL AND NOT NEW.is_anonymous THEN
        RAISE EXCEPTION 'Email cannot be null for non-anonymous users';
    END IF;

    -- Extract and validate data
    v_user_id := NEW.id;
    v_email := NEW.email;
    v_creator_id := (NEW.raw_user_meta_data->>'created_by')::UUID;
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    v_raw_role := LOWER(TRIM(NEW.raw_user_meta_data->>'role'));

    -- Role validation and assignment
    IF v_raw_role IS NULL OR v_raw_role = '' THEN
        v_role := 'dispatcher'::public.employee_role;
        RAISE WARNING 'No role specified for user %, defaulting to dispatcher', v_email;
    ELSE
        BEGIN
            -- Validate role string before casting
            IF v_raw_role NOT IN ('dispatcher', 'supervisor', 'manager') THEN
                RAISE WARNING 'Invalid role % specified for user %, defaulting to dispatcher', v_raw_role, v_email;
                v_role := 'dispatcher'::public.employee_role;
            ELSE
                v_role := v_raw_role::public.employee_role;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error casting role for user %: %. Defaulting to dispatcher', v_email, SQLERRM;
            v_role := 'dispatcher'::public.employee_role;
        END;
    END IF;

    -- Create/update profile and employee records
    IF NOT NEW.is_anonymous THEN
        -- Profile handling
        BEGIN
            INSERT INTO public.profiles (id, email, role, is_email_verified)
            VALUES (v_user_id, v_email, v_role::TEXT, (NEW.email_confirmed_at IS NOT NULL))
            ON CONFLICT (id) DO UPDATE 
            SET email = EXCLUDED.email,
                role = EXCLUDED.role,
                is_email_verified = EXCLUDED.is_email_verified,
                updated_at = CURRENT_TIMESTAMP;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error upserting profile for user %: %', v_email, SQLERRM;
            RETURN NEW;
        END;

        -- Employee handling
        BEGIN
            INSERT INTO public.employees (
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
                    WHEN v_role = 'supervisor' THEN 'pattern_a'::public.shift_pattern 
                    ELSE 'pattern_b'::public.shift_pattern 
                END,
                v_creator_id
            )
            ON CONFLICT (auth_id) DO UPDATE 
            SET first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                email = EXCLUDED.email,
                role = EXCLUDED.role,
                updated_at = CURRENT_TIMESTAMP;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error upserting employee for user %: %', v_email, SQLERRM;
            -- Don't return here, let the profile creation succeed if it can
        END;
    END IF;

    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS and create policies for employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can view their own profile"
    ON public.employees
    FOR SELECT
    USING (auth.uid() = auth_id);
CREATE POLICY "Employees can update their own profile"
    ON public.employees
    FOR UPDATE
    USING (auth.uid() = auth_id)
    WITH CHECK (auth.uid() = auth_id);

-- Additional Auth Permissions and Fixes
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, supabase_auth_admin;
GRANT SELECT, INSERT, UPDATE ON auth.users TO supabase_auth_admin;
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO service_role;

ALTER DATABASE postgres SET search_path TO public, auth, extensions;
ALTER ROLE authenticator SET search_path TO public, auth, extensions;
ALTER ROLE anon SET search_path TO public, auth, extensions;
ALTER ROLE authenticated SET search_path TO public, auth, extensions;
ALTER ROLE service_role SET search_path TO public, auth, extensions;

-- Define helper functions for JWT claims for session management.
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS uuid 
LANGUAGE sql 
STABLE
AS $$
  SELECT 
    COALESCE(
      current_setting('request.jwt.claim.sub', true),
      (current_setting('request.jwt.claims', true)::jsonb->>'sub')
    )::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role() 
RETURNS text 
LANGUAGE sql 
STABLE
AS $$
  SELECT 
    COALESCE(
      current_setting('request.jwt.claim.role', true),
      (current_setting('request.jwt.claims', true)::jsonb->>'role')
    )::text
$$;

CREATE OR REPLACE FUNCTION auth.email() 
RETURNS text 
LANGUAGE sql 
STABLE
AS $$
  SELECT 
    COALESCE(
      current_setting('request.jwt.claim.email', true),
      (current_setting('request.jwt.claims', true)::jsonb->>'email')
    )::text
$$;

GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA auth TO anon, authenticated;

-- Ensure RLS for auth.sessions (if sessions table exists)
ALTER TABLE IF EXISTS auth.sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access own sessions" ON auth.sessions;
CREATE POLICY "Users can only access own sessions" ON auth.sessions
    FOR ALL
    USING (auth.uid() = user_id);

-- Add session validation function
CREATE OR REPLACE FUNCTION auth.validate_session(session_id TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth, extensions
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users u
        WHERE u.id = (session_id::uuid)
        AND u.deleted_at IS NULL
        AND u.banned_until IS NULL
    );
END;
$$;

-- Add session cleanup function with a different name
CREATE OR REPLACE FUNCTION auth.cleanup_inactive_users()
RETURNS void
SECURITY DEFINER
SET search_path = public, auth, extensions
LANGUAGE plpgsql
AS $$
BEGIN
    -- Cleanup inactive users
    UPDATE auth.users
    SET deleted_at = NOW()
    WHERE last_sign_in_at < NOW() - INTERVAL '90 days'
    AND deleted_at IS NULL;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.employees TO authenticated; 