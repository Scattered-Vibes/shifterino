-- Auth Functions Migration
-- Contains only auth-related functions and removes duplicates

-- Note: Types and tables are already created in core_schema.sql

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