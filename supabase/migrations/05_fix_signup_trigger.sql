-- Create a logging table for debugging
CREATE TABLE IF NOT EXISTS public.auth_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    operation TEXT,
    user_id UUID,
    details JSONB,
    error_message TEXT
);

-- Grant access to the logging table
GRANT INSERT ON public.auth_logs TO service_role, postgres, authenticated;
GRANT USAGE ON SEQUENCE public.auth_logs_id_seq TO service_role, postgres, authenticated;

-- Recreate the handle_new_user function with better error handling and logging
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
    -- Log the start of the operation
    INSERT INTO public.auth_logs (operation, user_id, details)
    VALUES ('signup_start', NEW.id, jsonb_build_object('email', NEW.email));

    -- Wrap everything in a transaction
    BEGIN
        -- Input validation
        IF NEW.raw_user_meta_data IS NULL THEN
            NEW.raw_user_meta_data := '{}'::jsonb;
        END IF;

        -- Extract and validate data
        v_user_id := NEW.id;
        v_email := NEW.email;
        v_creator_id := (NEW.raw_user_meta_data->>'created_by')::UUID;
        v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
        v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
        v_raw_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', 'dispatcher')));

        -- Role assignment
        IF v_raw_role NOT IN ('dispatcher', 'supervisor', 'manager') THEN
            v_role := 'dispatcher'::public.employee_role;
        ELSE
            v_role := v_raw_role::public.employee_role;
        END IF;

        -- Set the role in auth.users first
        NEW.role := v_role::TEXT;

        -- Create profile
        INSERT INTO public.profiles (id, email, role, is_email_verified)
        VALUES (v_user_id, v_email, v_role::TEXT, COALESCE(NEW.email_confirmed_at IS NOT NULL, false))
        ON CONFLICT (id) DO UPDATE 
        SET email = EXCLUDED.email,
            role = EXCLUDED.role,
            is_email_verified = EXCLUDED.is_email_verified,
            updated_at = CURRENT_TIMESTAMP;

        -- Create employee record
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

        -- Log successful completion
        INSERT INTO public.auth_logs (operation, user_id, details)
        VALUES ('signup_success', NEW.id, jsonb_build_object(
            'email', v_email,
            'role', v_role,
            'profile_created', true,
            'employee_created', true
        ));

        RETURN NEW;

    EXCEPTION WHEN OTHERS THEN
        -- Log the error
        v_error_details := jsonb_build_object(
            'email', v_email,
            'error_code', SQLSTATE,
            'error_message', SQLERRM,
            'error_context', jsonb_build_object(
                'role', v_role,
                'user_id', v_user_id
            )
        );
        
        INSERT INTO public.auth_logs (operation, user_id, details, error_message)
        VALUES ('signup_error', NEW.id, v_error_details, SQLERRM);

        -- Re-raise the error
        RAISE EXCEPTION 'Error in handle_new_user: %', SQLERRM;
    END;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role, postgres, authenticated;

-- Add RLS policies for auth_logs
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can see all logs"
    ON public.auth_logs
    FOR SELECT
    TO service_role
    USING (true);

CREATE POLICY "Users can see their own logs"
    ON public.auth_logs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Grant necessary permissions to the authenticator role
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticator; 