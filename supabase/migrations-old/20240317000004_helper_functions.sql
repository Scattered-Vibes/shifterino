-- Function to get the currently authenticated user's ID
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
$$;

-- Function to check if user is manager
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.employees
    WHERE auth_id = auth.uid()::uuid
    AND role = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is supervisor or above
CREATE OR REPLACE FUNCTION public.is_supervisor_or_above()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.employees
    WHERE auth_id = auth.uid()::uuid
    AND role IN ('supervisor', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get team members for a supervisor
CREATE OR REPLACE FUNCTION public.get_team_members()
RETURNS TABLE (employee_id uuid) AS $$
BEGIN
    RETURN QUERY
    SELECT e.id
    FROM public.employees e
    WHERE EXISTS (
      SELECT 1 FROM public.employees supervisor
      WHERE supervisor.auth_id = auth.uid()::uuid
      AND supervisor.role IN ('supervisor', 'manager')
      AND e.team_id = supervisor.team_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to set created_by field
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS trigger AS $$
BEGIN
  -- Check if the table has created_by column
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = TG_TABLE_SCHEMA
    AND table_name = TG_TABLE_NAME
    AND column_name = 'created_by'
  ) THEN
    IF TG_OP = 'INSERT' AND NEW.created_by IS NULL THEN
      NEW.created_by = auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set updated_by field
CREATE OR REPLACE FUNCTION public.set_updated_by()
RETURNS trigger AS $$
BEGIN
  -- Check if the table has updated_by column
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = TG_TABLE_SCHEMA
    AND table_name = TG_TABLE_NAME
    AND column_name = 'updated_by'
  ) THEN
    IF TG_OP = 'UPDATE' AND NEW.updated_by IS NULL THEN
      NEW.updated_by = auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
    -- First, ensure profile_incomplete is set in user metadata
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{profile_incomplete}',
        'true'::jsonb
    )
    WHERE id = NEW.id;

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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 