-- Fix search path issues
SET search_path TO public, auth, extensions;

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the handle_new_user function with correct search path
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
    
    -- Create profile
    INSERT INTO public.profiles (id, email, role, is_email_verified)
    VALUES (v_user_id, v_email, v_role::TEXT, (NEW.email_confirmed_at IS NOT NULL));

    -- Create employee record
    INSERT INTO public.employees (auth_id, first_name, last_name, email, role, shift_pattern, created_by)
    VALUES (
        v_user_id,
        v_first_name,
        v_last_name,
        v_email,
        v_role,
        CASE WHEN v_role = 'supervisor' THEN 'pattern_a'::public.shift_pattern ELSE 'pattern_b'::public.shift_pattern END,
        v_creator_id
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Ensure search path is set correctly at all levels
ALTER DATABASE postgres SET search_path TO public, auth, extensions;
ALTER ROLE authenticator SET search_path TO public, auth, extensions;
ALTER ROLE anon SET search_path TO public, auth, extensions;
ALTER ROLE authenticated SET search_path TO public, auth, extensions;
ALTER ROLE service_role SET search_path TO public, auth, extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public, auth TO authenticator, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO authenticated; 