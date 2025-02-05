-- 001_core_schema_and_auth.sql
-- This migration consolidates extensions, core authentication, employee tables,
-- related enum types, test helper functions, and the new user handling logic.

-- SECTION 1: EXTENSIONS & SCHEMAS
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;

-- Optionally create a schema for test helpers (if used only in test environments)
CREATE SCHEMA IF NOT EXISTS test_helpers;

-- Test helper functions
CREATE OR REPLACE FUNCTION test_helpers.clean_test_data()
RETURNS void AS $$
BEGIN
    DELETE FROM public.shift_swap_requests WHERE shift_id IN (
        SELECT id FROM public.individual_shifts WHERE schedule_period_id IN (
            SELECT id FROM public.schedule_periods WHERE created_at >= CURRENT_DATE
        )
    );
    DELETE FROM public.scheduling_logs WHERE schedule_period_id IN (
        SELECT id FROM public.schedule_periods WHERE created_at >= CURRENT_DATE
    );
    DELETE FROM public.individual_shifts WHERE schedule_period_id IN (
        SELECT id FROM public.schedule_periods WHERE created_at >= CURRENT_DATE
    );
    DELETE FROM public.time_off_requests WHERE employee_id IN (
        SELECT id FROM public.employees WHERE email LIKE '%@test.com'
    );
    DELETE FROM public.shift_options WHERE name LIKE 'Test%';
    DELETE FROM public.schedule_periods WHERE created_at >= CURRENT_DATE;
    DELETE FROM public.employees WHERE email LIKE '%@test.com';
    DELETE FROM public.profiles WHERE email LIKE '%@test.com';
    DELETE FROM auth.users WHERE email LIKE '%@test.com';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_helpers.set_auth_user(p_user_id uuid, p_role text)
RETURNS void AS $$
BEGIN
    PERFORM set_config('request.jwt.claim.sub', COALESCE(p_user_id::text, ''), true);
    PERFORM set_config('request.jwt.claim.role', p_role, true);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_helpers.create_test_user(
    p_email text,
    p_role text,
    p_suffix text DEFAULT ''
) RETURNS TABLE (
    auth_id uuid,
    employee_id uuid
) AS $$
DECLARE
    v_auth_id uuid;
    v_employee_id uuid;
    v_email text;
BEGIN
    IF p_suffix = '' THEN
        v_email := p_email;
    ELSE
        v_email := replace(p_email, '@', '_' || p_suffix || '@');
    END IF;
    ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
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
        p_role,
        'test-password',
        jsonb_build_object('role', p_role),
        NOW(),
        NOW()
    )
    RETURNING id INTO v_auth_id;
    
    INSERT INTO public.profiles (id, email, role)
    VALUES (v_auth_id, v_email, p_role);
    
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
        p_role::employee_role,
        'pattern_a'
    )
    RETURNING id INTO v_employee_id;
    
    ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
    
    RETURN QUERY SELECT v_auth_id, v_employee_id;
END;
$$ LANGUAGE plpgsql;

-- SECTION 2: ROLE SETUP & ENUM TYPES -- (these roles and types come from several earlier migrations)
ALTER ROLE authenticator SET search_path TO public, auth, extensions;
ALTER ROLE anon SET search_path TO public, auth, extensions;
ALTER ROLE authenticated SET search_path TO public, auth, extensions;
ALTER ROLE service_role SET search_path TO public, auth, extensions;

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

-- SECTION 3: AUTH & PROFILE TABLES
CREATE SCHEMA IF NOT EXISTS auth;

DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS auth.users CASCADE;

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

-- Create profiles and employees tables
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

-- Trigger function for updating updated_at columns
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

-- SECTION 4: NEW USER HANDLING WITH LOGGING
-- Create a table for logging (for improved debugging during signup)
CREATE TABLE IF NOT EXISTS public.auth_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    operation TEXT,
    user_id UUID,
    details JSONB,
    error_message TEXT
);

GRANT INSERT ON public.auth_logs TO service_role, postgres, authenticated;
GRANT USAGE ON SEQUENCE public.auth_logs_id_seq TO service_role, postgres, authenticated;

-- New user trigger function (incorporates fixes from earlier migrations)
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
    v_error_details JSONB;
BEGIN
    INSERT INTO public.auth_logs (operation, user_id, details)
    VALUES ('signup_start', NEW.id, jsonb_build_object('email', NEW.email));

    BEGIN
        IF NEW.raw_user_meta_data IS NULL THEN
            NEW.raw_user_meta_data := '{}'::jsonb;
        END IF;

        v_user_id := NEW.id;
        v_email := NEW.email;
        v_creator_id := (NEW.raw_user_meta_data->>'created_by')::UUID;
        v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
        v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
        v_raw_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', 'dispatcher')));

        IF v_raw_role NOT IN ('dispatcher', 'supervisor', 'manager') THEN
            v_role := 'dispatcher'::public.employee_role;
        ELSE
            v_role := v_raw_role::public.employee_role;
        END IF;

        NEW.role := v_role::TEXT;

        INSERT INTO public.profiles (id, email, role, is_email_verified)
        VALUES (v_user_id, v_email, v_role::TEXT, (NEW.email_confirmed_at IS NOT NULL))
        ON CONFLICT (id) DO UPDATE 
        SET email = EXCLUDED.email,
            role = EXCLUDED.role,
            is_email_verified = EXCLUDED.is_email_verified,
            updated_at = CURRENT_TIMESTAMP;

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

        INSERT INTO public.auth_logs (operation, user_id, details)
        VALUES ('signup_success', NEW.id, jsonb_build_object(
            'email', v_email,
            'role', v_role
        ));
        RETURN NEW;

    EXCEPTION WHEN OTHERS THEN
        v_error_details := jsonb_build_object(
            'email', v_email,
            'error_code', SQLSTATE,
            'error_message', SQLERRM,
            'user_id', v_user_id
        );
        INSERT INTO public.auth_logs (operation, user_id, details, error_message)
        VALUES ('signup_error', NEW.id, v_error_details, SQLERRM);
        RAISE EXCEPTION 'Error in handle_new_user: %', SQLERRM;
    END;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- SECTION 5: PERMISSIONS & RLS
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, supabase_auth_admin;
GRANT SELECT, INSERT, UPDATE ON auth.users TO supabase_auth_admin;
GRANT SELECT ON auth.users TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO service_role;

ALTER DATABASE postgres SET search_path TO public, auth, extensions; 