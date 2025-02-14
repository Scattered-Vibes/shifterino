-- Drop and recreate the trigger function with updated order of operations
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
    current_metadata jsonb;
BEGIN
    -- Get current metadata
    SELECT raw_user_meta_data INTO current_metadata FROM auth.users WHERE id = NEW.id;
    
    -- Update metadata if profile_incomplete is not set
    IF NOT (current_metadata ? 'profile_incomplete') THEN
        UPDATE auth.users
        SET raw_user_meta_data = jsonb_set(
            COALESCE(current_metadata, '{}'::jsonb),
            '{profile_incomplete}',
            'true'::jsonb
        )
        WHERE id = NEW.id;
    END IF;

    -- Then create the employee record if it doesn't exist
    INSERT INTO public.employees (
        auth_id,
        email,
        first_name,
        last_name,
        role,
        shift_pattern,
        preferred_shift_category,
        weekly_hours_cap,
        max_overtime_hours
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            (current_metadata->>'first_name')::text,
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(
            (current_metadata->>'last_name')::text,
            split_part(split_part(NEW.email, '@', 1), '.', 2)
        ),
        COALESCE(
            (current_metadata->>'role')::public.employee_role,
            'dispatcher'
        ),
        COALESCE(
            (current_metadata->>'shift_pattern')::public.shift_pattern,
            '4_10'
        ),
        COALESCE(
            (current_metadata->>'preferred_shift_category')::public.shift_category,
            'DAY'
        ),
        40,
        0
    )
    ON CONFLICT (auth_id) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log the error details
        RAISE WARNING 'Error in handle_auth_user_created: %', SQLERRM;
        -- Still return NEW to allow the insert to proceed
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_created(); 