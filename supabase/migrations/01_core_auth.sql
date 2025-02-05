-- 01_core_auth.sql
-- This file consolidates core schema and authentication setup:
--   • Core table and enum creation
--   • Auth.users, profiles, employees with triggers and functions
--   • Fixes for search paths, authentication settings, and permissions

-- Section 1: Core and Authentication Setup

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

DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS auth.users CASCADE;
DROP TYPE IF EXISTS public.employee_role CASCADE;
DROP TYPE IF EXISTS public.shift_pattern CASCADE;
DROP TYPE IF EXISTS public.shift_category CASCADE;
DROP TYPE IF EXISTS public.time_off_status CASCADE;
DROP TYPE IF EXISTS public.shift_status CASCADE;
DROP TYPE IF EXISTS public.log_severity CASCADE;

CREATE SCHEMA IF NOT EXISTS auth;

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

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_role CHECK (role IN ('dispatcher', 'supervisor', 'manager'))
);

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

-- Section 2: New User Handling (latest version)
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
BEGIN
    IF NEW.email IS NULL AND NOT NEW.is_anonymous THEN
        RAISE EXCEPTION 'email cannot be null for non-anonymous users';
    END IF;
    v_user_id := NEW.id;
    v_email := NEW.email;
    v_creator_id := NEW.raw_user_meta_data->>'created_by';
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    BEGIN
        v_role := (NEW.raw_user_meta_data->>'role')::public.employee_role;
    EXCEPTION WHEN OTHERS THEN
        v_role := 'dispatcher'::public.employee_role;
    END;
    IF NOT NEW.is_anonymous THEN
        BEGIN
            INSERT INTO public.profiles (id, email, role, is_email_verified)
            VALUES (v_user_id, v_email, v_role::TEXT, (NEW.email_confirmed_at IS NOT NULL));
        EXCEPTION WHEN unique_violation THEN
            UPDATE public.profiles 
            SET email = v_email,
                role = v_role::TEXT,
                is_email_verified = (NEW.email_confirmed_at IS NOT NULL),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_user_id;
        END;
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
                CASE WHEN v_role = 'supervisor' THEN 'pattern_a'::public.shift_pattern 
                     ELSE 'pattern_b'::public.shift_pattern END,
                v_creator_id
            );
        EXCEPTION WHEN unique_violation THEN
            UPDATE public.employees 
            SET first_name = v_first_name,
                last_name = v_last_name,
                email = v_email,
                role = v_role,
                updated_at = CURRENT_TIMESTAMP
            WHERE auth_id = v_user_id;
        END;
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for email %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Section 3: Permissions Fixes for Auth Schema
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, supabase_auth_admin;
GRANT SELECT, INSERT, UPDATE ON auth.users TO supabase_auth_admin;
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO service_role; 