-- Ensure consistent auth settings
SET search_path TO public, auth, extensions;

-- Update auth settings
ALTER ROLE authenticator SET search_path TO public, auth, extensions;
ALTER ROLE anon SET search_path TO public, auth, extensions;
ALTER ROLE authenticated SET search_path TO public, auth, extensions;
ALTER ROLE service_role SET search_path TO public, auth, extensions;
ALTER DATABASE postgres SET search_path TO public, auth, extensions;

-- Ensure proper schema usage
GRANT USAGE ON SCHEMA auth TO authenticator, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO authenticator, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA extensions TO authenticator, anon, authenticated, service_role;

-- Grant necessary table permissions
GRANT ALL ON ALL TABLES IN SCHEMA auth TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO authenticated;

-- Ensure auth.users has proper permissions
GRANT SELECT, INSERT, UPDATE ON auth.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON auth.users TO anon;

-- Update the handle_new_user function to be more robust
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
    IF NEW.email IS NULL THEN
        RAISE EXCEPTION 'email cannot be null';
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
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error details
    RAISE WARNING 'Error in handle_new_user for email %: %', NEW.email, SQLERRM;
    -- Return NEW to allow the auth.users insert to complete
    RETURN NEW;
END;
$$; 