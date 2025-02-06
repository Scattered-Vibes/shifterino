-- Enable RLS on auth-related tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Employees policies
CREATE POLICY "Users can view own employee record"
  ON public.employees
  FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own employee record"
  ON public.employees
  FOR UPDATE
  USING (auth.uid() = auth_id);

CREATE POLICY "Supervisors can view their team's employee records"
  ON public.employees
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'supervisor' OR profiles.role = 'manager')
    )
  );

CREATE POLICY "Managers can update any employee record"
  ON public.employees
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Auth logs policies
CREATE POLICY "Users can view own auth logs"
  ON public.auth_logs
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view all auth logs"
  ON public.auth_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Function to validate user session
CREATE OR REPLACE FUNCTION auth.validate_user_session()
RETURNS BOOLEAN AS $$
DECLARE
  _user_id UUID;
  _role TEXT;
BEGIN
  -- Get the user ID from the current session
  _user_id := auth.uid();
  
  -- If no user ID, session is invalid
  IF _user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user exists and is not deleted
  SELECT role INTO _role
  FROM auth.users
  WHERE id = _user_id
  AND deleted_at IS NULL;
  
  -- If no role found, user doesn't exist or is deleted
  IF _role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Session is valid
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 