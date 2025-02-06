-- 001_core_schema_and_auth_sessions.sql
--
-- This consolidated migration sets up:
--  • Required extensions and schemas (including auth)
--  • Role creation and enum types (employee_role, shift_pattern, etc.)
--  • Core authentication tables, profiles, and employees,
--    including triggers (updated_at) and user‐creation logging.
--  • The auth.sessions, auth.refresh_tokens, and auth.mfa_amr_claims tables
--  • JWT secret management functions (auth.jwt(), auth.role())
--
-- Extensions & Schemas
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS extensions;

-- Role Setup & Enum Types
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

-- Create logging table now so that functions in this migration referencing it will find it
CREATE TABLE IF NOT EXISTS public.auth_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation text NOT NULL,
  user_id uuid,
  details jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Core Auth Tables: auth.users, public.profiles, public.employees

DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS auth.users CASCADE;

CREATE TABLE auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id uuid,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamptz,
    invited_at timestamptz,
    confirmation_token character varying(255),
    confirmation_sent_at timestamptz,
    recovery_token character varying(255),
    recovery_sent_at timestamptz,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamptz,
    last_sign_in_at timestamptz,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    phone text DEFAULT NULL,
    phone_confirmed_at timestamptz,
    phone_change text DEFAULT '',
    phone_change_token character varying(255) DEFAULT '',
    phone_change_sent_at timestamptz,
    confirmed_at timestamptz,
    email_change_token_current character varying(255) DEFAULT '',
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamptz,
    reauthentication_token character varying(255) DEFAULT '',
    reauthentication_sent_at timestamptz,
    is_sso_user boolean DEFAULT false,
    deleted_at timestamptz,
    is_anonymous boolean DEFAULT false,
    factors integer DEFAULT 0
);

CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL UNIQUE,
    role text NOT NULL,
    is_email_verified boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_role CHECK (role IN ('dispatcher', 'supervisor', 'manager'))
);

CREATE TABLE public.employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text UNIQUE NOT NULL,
    role public.employee_role NOT NULL,
    shift_pattern public.shift_pattern NOT NULL,
    preferred_shift_category public.shift_category,
    weekly_hours_cap integer NOT NULL DEFAULT 40,
    max_overtime_hours integer DEFAULT 0,
    last_shift_date date,
    total_hours_current_week integer DEFAULT 0,
    consecutive_shifts_count integer DEFAULT 0,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
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

-- New User Handling Logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, auth, extensions
LANGUAGE plpgsql
AS $$
DECLARE
    v_role public.employee_role;
    v_email text;
    v_user_id uuid;
    v_creator_id uuid;
    v_first_name text;
    v_last_name text;
    v_raw_role text;
    v_error_details jsonb;
    v_validation_errors text[];
BEGIN
    -- Log the start of the operation with full details
    INSERT INTO public.auth_logs (operation, user_id, details)
    VALUES ('signup_start', NEW.id, jsonb_build_object(
        'email', NEW.email,
        'metadata', NEW.raw_user_meta_data,
        'timestamp', CURRENT_TIMESTAMP
    ));

    BEGIN
        -- Initialize metadata if null
        IF NEW.raw_user_meta_data IS NULL THEN
            NEW.raw_user_meta_data := '{}'::jsonb;
        END IF;

        -- Extract and validate required fields
        v_user_id := NEW.id;
        v_email := NEW.email;
        v_creator_id := (NEW.raw_user_meta_data->>'created_by')::uuid;
        v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
        v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
        v_raw_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', 'dispatcher')));

        -- Validate email
        IF v_email IS NULL OR v_email = '' OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
            v_validation_errors := array_append(v_validation_errors, 'Invalid email format');
        END IF;

        -- Validate and set role
        IF v_raw_role NOT IN ('dispatcher', 'supervisor', 'manager') THEN
            v_validation_errors := array_append(v_validation_errors, 'Invalid role specified');
            v_role := 'dispatcher'::public.employee_role;
        ELSE
            v_role := v_raw_role::public.employee_role;
        END IF;

        -- Check for validation errors
        IF array_length(v_validation_errors, 1) > 0 THEN
            RAISE EXCEPTION 'Validation failed: %', array_to_string(v_validation_errors, ', ');
        END IF;

        -- Create profile with UPSERT
        INSERT INTO public.profiles (id, email, role, is_email_verified)
        VALUES (v_user_id, v_email, v_role::text, (NEW.email_confirmed_at IS NOT NULL))
        ON CONFLICT (id) DO UPDATE 
            SET email = EXCLUDED.email,
                role = EXCLUDED.role,
                is_email_verified = EXCLUDED.is_email_verified,
                updated_at = CURRENT_TIMESTAMP;

        -- Create employee record with UPSERT
        INSERT INTO public.employees (
            auth_id, first_name, last_name, email, role, shift_pattern, created_by
        )
        VALUES (
            v_user_id, v_first_name, v_last_name, v_email, v_role,
            CASE WHEN v_role = 'supervisor' THEN 'pattern_a'::public.shift_pattern ELSE 'pattern_b'::public.shift_pattern END,
            v_creator_id
        )
        ON CONFLICT (auth_id) DO UPDATE 
            SET first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                email = EXCLUDED.email,
                role = EXCLUDED.role,
                updated_at = CURRENT_TIMESTAMP;

        -- Log successful creation
        INSERT INTO public.auth_logs (operation, user_id, details)
        VALUES ('signup_success', NEW.id, jsonb_build_object(
            'email', v_email,
            'role', v_role,
            'profile_created', true,
            'employee_created', true
        ));

        -- Update user metadata with confirmed values
        NEW.raw_user_meta_data := NEW.raw_user_meta_data || jsonb_build_object(
            'role', v_role,
            'profile_id', v_user_id,
            'employee_id', v_user_id
        );

        RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
        -- Build detailed error information
        v_error_details := jsonb_build_object(
            'email', v_email,
            'error_code', SQLSTATE,
            'error_message', SQLERRM,
            'user_id', v_user_id,
            'validation_errors', to_jsonb(v_validation_errors),
            'context', jsonb_build_object(
                'role', v_role,
                'raw_role', v_raw_role,
                'metadata', NEW.raw_user_meta_data
            )
        );

        -- Log the error with full context
        INSERT INTO public.auth_logs (operation, user_id, details, error_message)
        VALUES ('signup_error', NEW.id, v_error_details, SQLERRM);

        RAISE EXCEPTION 'Error in handle_new_user: % (Details: %)', SQLERRM, v_error_details;
    END;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Auth Sessions & Related Tables
CREATE TABLE IF NOT EXISTS auth.sessions (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamptz,
    refreshed_at timestamp,
    user_agent text,
    ip inet,
    tag text
);

CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    token character varying(255),
    user_id character varying(255),
    revoked boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    parent character varying(255),
    session_id uuid
);

CREATE TABLE IF NOT EXISTS auth.mfa_amr_claims (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    authentication_method text NOT NULL,
    CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method)
);

-- AAL Level type setup
DO $$ BEGIN
    CREATE TYPE auth.aal_level AS ENUM ('aal1', 'aal2', 'aal3');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DROP TRIGGER IF EXISTS update_sessions_updated_at ON auth.sessions;
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON auth.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_refresh_tokens_updated_at ON auth.refresh_tokens;
CREATE TRIGGER update_refresh_tokens_updated_at
    BEFORE UPDATE ON auth.refresh_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_mfa_amr_claims_updated_at ON auth.mfa_amr_claims;
CREATE TRIGGER update_mfa_amr_claims_updated_at
    BEFORE UPDATE ON auth.mfa_amr_claims
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

-- JWT Secrets & Configuration
CREATE TABLE IF NOT EXISTS auth.secrets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    secret text NOT NULL,
    key_id uuid NOT NULL DEFAULT gen_random_uuid(),
    key_salt text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

GRANT ALL ON auth.secrets TO supabase_auth_admin;
GRANT SELECT ON auth.secrets TO authenticator;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
    SELECT coalesce(
      nullif(current_setting('request.jwt.claim', true), ''),
      nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb;
$$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
    SELECT coalesce(
       nullif(current_setting('request.jwt.claim.role', true), ''),
       nullif(current_setting('request.jwt.claims.role', true), '')
    )::text;
$$;

GRANT EXECUTE ON FUNCTION auth.jwt() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO anon, authenticated, service_role; 