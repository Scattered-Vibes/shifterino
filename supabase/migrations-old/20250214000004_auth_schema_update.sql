-- Add missing columns to auth.users table
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS factors INTEGER DEFAULT 0;

-- Update search path for consistency
SET search_path TO public, auth, extensions;

-- Ensure proper permissions
GRANT ALL ON auth.users TO authenticated, anon, service_role;

-- Recreate the handle_new_user function with updated schema
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
    -- Input validation
    IF NEW.email IS NULL AND NOT NEW.is_anonymous THEN
        RAISE EXCEPTION 'email cannot be null for non-anonymous users';
    END IF;

    -- Set variables
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
    
    -- Skip profile creation for anonymous users
    IF NOT NEW.is_anonymous THEN
        -- Create profile with explicit transaction handling
        BEGIN
            INSERT INTO public.profiles (id, email, role, is_email_verified)
            VALUES (v_user_id, v_email, v_role::TEXT, (NEW.email_confirmed_at IS NOT NULL));
        EXCEPTION WHEN unique_violation THEN
            -- Profile already exists, update it
            UPDATE public.profiles 
            SET email = v_email,
                role = v_role::TEXT,
                is_email_verified = (NEW.email_confirmed_at IS NOT NULL),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_user_id;
        END;

        -- Create employee record with explicit transaction handling
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
            -- Employee record already exists, update it
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
    -- Log the error details
    RAISE WARNING 'Error in handle_new_user for email %: %', NEW.email, SQLERRM;
    -- Return NEW to allow the auth.users insert to complete
    RETURN NEW;
END;
$$; 