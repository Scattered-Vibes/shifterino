-- Drop and recreate the trigger function with updated order of operations
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
    v_metadata jsonb;
    v_first_name text;
    v_last_name text;
    v_role public.employee_role;
    v_shift_pattern public.shift_pattern;
BEGIN
    -- First try app_metadata, then fall back to user_metadata if needed
    v_metadata := COALESCE(NEW.raw_app_meta_data, NEW.raw_user_meta_data, '{}'::jsonb);
    
    -- Extract user metadata with proper error handling and logging
    BEGIN
        -- Get first name with detailed logging
        v_first_name := v_metadata->>'first_name';
        IF v_first_name IS NULL OR v_first_name = '' THEN
            v_first_name := split_part(NEW.email, '@', 1);
            RAISE WARNING 'Using email prefix for first_name: %', v_first_name;
        END IF;
        
        -- Get last name with detailed logging
        v_last_name := v_metadata->>'last_name';
        IF v_last_name IS NULL OR v_last_name = '' THEN
            v_last_name := '';
            RAISE WARNING 'No last_name provided for user: %', NEW.email;
        END IF;
        
        -- Get role with validation
        BEGIN
            v_role := (v_metadata->>'role')::public.employee_role;
        EXCEPTION WHEN OTHERS THEN
            v_role := 'dispatcher';
            RAISE WARNING 'Invalid role for user %, defaulting to dispatcher', NEW.email;
        END;
        
        -- Get shift pattern with validation
        BEGIN
            v_shift_pattern := (v_metadata->>'shift_pattern')::public.shift_pattern;
        EXCEPTION WHEN OTHERS THEN
            v_shift_pattern := '4_10';
            RAISE WARNING 'Invalid shift_pattern for user %, defaulting to 4_10', NEW.email;
        END;
        
    EXCEPTION WHEN OTHERS THEN
        -- Log error and use defaults
        RAISE WARNING 'Error processing user metadata for %: %', NEW.email, SQLERRM;
        v_first_name := split_part(NEW.email, '@', 1);
        v_last_name := '';
        v_role := 'dispatcher';
        v_shift_pattern := '4_10';
    END;

    -- Set profile_incomplete flag if necessary
    IF v_first_name = split_part(NEW.email, '@', 1) OR v_last_name = '' THEN
        -- Log the reason for incomplete profile
        RAISE WARNING 'Profile marked as incomplete for %: first_name_is_email=%, last_name_empty=%',
            NEW.email,
            v_first_name = split_part(NEW.email, '@', 1),
            v_last_name = '';
            
        UPDATE auth.users
        SET raw_app_meta_data = jsonb_set(
            COALESCE(raw_app_meta_data, '{}'::jsonb),
            '{profile_incomplete}',
            'true'::jsonb
        )
        WHERE id = NEW.id;
    END IF;

    -- Create employee record with atomic operation
    INSERT INTO public.employees (
        auth_id,
        email,
        first_name,
        last_name,
        role,
        shift_pattern,
        weekly_hours_cap,
        max_overtime_hours
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_first_name,
        v_last_name,
        v_role,
        v_shift_pattern,
        40,
        0
    )
    ON CONFLICT (auth_id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        shift_pattern = EXCLUDED.shift_pattern,
        updated_at = now();

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log detailed error information but don't prevent user creation
        RAISE WARNING 'Error in handle_auth_user_created for %: % (SQLSTATE: %)', 
            NEW.email, 
            SQLERRM,
            SQLSTATE;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_created(); 