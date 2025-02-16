-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_auth_user_created();

-- Create new simplified trigger function
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name text;
  v_last_name text;
  v_role public.employee_role;
  v_shift_pattern public.shift_pattern;
BEGIN
  -- Extract metadata, with defaults
  v_first_name := COALESCE((NEW.raw_user_meta_data->>'first_name')::text, split_part(NEW.email, '@', 1));
  v_last_name := COALESCE((NEW.raw_user_meta_data->>'last_name')::text, '');
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.employee_role, 'dispatcher');
  v_shift_pattern := COALESCE((NEW.raw_user_meta_data->>'shift_pattern')::public.shift_pattern, '4_10');

  -- Set profile_incomplete flag
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{profile_incomplete}',
      'true'::jsonb
  )
  WHERE id = NEW.id;

  -- Create basic employee record
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
      updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error in handle_auth_user_created: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_created();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_auth_user_created IS 'Handles new user creation by setting profile_incomplete flag and creating basic employee record'; 