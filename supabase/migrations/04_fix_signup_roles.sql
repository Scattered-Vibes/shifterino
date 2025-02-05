-- Fix role granting for new signups
-- Drop and recreate the handle_new_user function with better error handling
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
BEGIN
    -- Input validation with explicit error handling
    IF NEW.raw_user_meta_data IS NULL THEN
        NEW.raw_user_meta_data := '{}'::jsonb;
    END IF;

    IF NEW.email IS NULL AND NOT NEW.is_anonymous THEN
        RAISE EXCEPTION 'Email cannot be null for non-anonymous users';
    END IF;

    -- Extract and validate data
    v_user_id := NEW.id;
    v_email := NEW.email;
    v_creator_id := (NEW.raw_user_meta_data->>'created_by')::UUID;
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    v_raw_role := LOWER(TRIM(NEW.raw_user_meta_data->>'role'));

    -- Role validation and assignment with explicit error handling
    BEGIN
        IF v_raw_role IS NULL OR v_raw_role = '' THEN
            v_role := 'dispatcher'::public.employee_role;
        ELSIF v_raw_role NOT IN ('dispatcher', 'supervisor', 'manager') THEN
            v_role := 'dispatcher'::public.employee_role;
        ELSE
            v_role := v_raw_role::public.employee_role;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Log error and default to dispatcher
        RAISE WARNING 'Error setting role for user %: %. Defaulting to dispatcher', v_email, SQLERRM;
        v_role := 'dispatcher'::public.employee_role;
    END;

    -- Profile handling with explicit error handling
    BEGIN
        INSERT INTO public.profiles (id, email, role, is_email_verified)
        VALUES (v_user_id, v_email, v_role::TEXT, (NEW.email_confirmed_at IS NOT NULL))
        ON CONFLICT (id) DO UPDATE 
        SET email = EXCLUDED.email,
            role = EXCLUDED.role,
            is_email_verified = EXCLUDED.is_email_verified,
            updated_at = CURRENT_TIMESTAMP;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error upserting profile for user %: %', v_email, SQLERRM;
        -- Continue execution to try employee creation
    END;

    -- Employee handling with explicit error handling
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
            CASE 
                WHEN v_role = 'supervisor' THEN 'pattern_a'::public.shift_pattern 
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
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error upserting employee for user %: %', v_email, SQLERRM;
    END;

    -- Ensure proper role is set in auth.users
    NEW.role := v_role::TEXT;
    
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions for the signup process
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;

-- Ensure proper RLS policies for new users
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Grant necessary table permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.employees TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated; 