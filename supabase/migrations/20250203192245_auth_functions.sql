-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Create custom types if they don't exist
DO $$ BEGIN
    CREATE TYPE public.employee_role AS ENUM ('supervisor', 'dispatcher');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.shift_pattern AS ENUM ('pattern_a', 'pattern_b');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.shift_category AS ENUM ('early', 'day', 'swing', 'graveyard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table for user metadata
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY,
    email text,
    role text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create employees table if not exists
CREATE TABLE IF NOT EXISTS public.employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id uuid NOT NULL UNIQUE,
    first_name text NOT NULL DEFAULT '',
    last_name text NOT NULL DEFAULT '',
    email text NOT NULL UNIQUE,
    role employee_role NOT NULL,
    shift_pattern shift_pattern NOT NULL,
    preferred_shift_category shift_category,
    weekly_hours_cap integer NOT NULL DEFAULT 40,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create helper functions in public schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_role employee_role;
    v_email text;
    v_user_id uuid;
BEGIN
    -- Get user data
    v_user_id := NEW.id;
    v_email := NEW.email;
    
    -- Get and validate role with a safe default
    BEGIN
        v_role := (NEW.raw_user_meta_data->>'role')::employee_role;
    EXCEPTION WHEN OTHERS THEN
        v_role := 'dispatcher'::employee_role;
    END;

    -- Create profile
    INSERT INTO profiles (id, email, role)
    VALUES (v_user_id, v_email, v_role::text);

    -- Create employee record
    INSERT INTO employees (
        auth_id,
        first_name,
        last_name,
        email,
        role,
        shift_pattern
    )
    VALUES (
        v_user_id,
        '', -- Default empty first name
        '', -- Default empty last name
        v_email,
        v_role,
        CASE 
            WHEN v_role = 'supervisor' THEN 'pattern_a'::shift_pattern
            ELSE 'pattern_b'::shift_pattern
        END
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;