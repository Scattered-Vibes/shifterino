-- Update the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        -- First, ensure profile_incomplete is set in user metadata
        UPDATE auth.users
        SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{profile_incomplete}',
            'true'::jsonb
        )
        WHERE id = NEW.id;
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but continue with employee creation
        RAISE WARNING 'Error updating user metadata: %', SQLERRM;
    END;

    BEGIN
        -- Then create the employee record
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
            COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
            COALESCE(NEW.raw_user_meta_data->>'last_name', split_part(split_part(NEW.email, '@', 1), '.', 2)),
            COALESCE((NEW.raw_user_meta_data->>'role')::public.employee_role, 'dispatcher'),
            COALESCE((NEW.raw_user_meta_data->>'shift_pattern')::public.shift_pattern, '4_10'),
            COALESCE((NEW.raw_user_meta_data->>'shift_category')::public.shift_category, 'DAY'),
            40,
            0
        );
    EXCEPTION WHEN OTHERS THEN
        -- Log the error and re-raise
        RAISE EXCEPTION 'Error creating employee record: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 