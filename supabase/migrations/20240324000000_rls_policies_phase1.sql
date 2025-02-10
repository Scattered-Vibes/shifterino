-- Enable RLS on all tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is manager
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.employees
    WHERE auth_id = auth.uid()
    AND role = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is supervisor or above
CREATE OR REPLACE FUNCTION public.is_supervisor_or_above()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.employees
    WHERE auth_id = auth.uid()
    AND role IN ('supervisor', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's team members (for supervisors)
CREATE OR REPLACE FUNCTION public.get_team_members()
RETURNS TABLE (employee_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id FROM public.employees e
  WHERE EXISTS (
    SELECT 1 FROM public.employees supervisor
    WHERE supervisor.auth_id = auth.uid()
    AND supervisor.role IN ('supervisor', 'manager')
    AND e.team_id = supervisor.team_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Employees table policies
CREATE POLICY "employees_select_own" ON public.employees
  FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY "employees_select_supervisor" ON public.employees
  FOR SELECT USING (
    is_supervisor_or_above()
    AND id IN (SELECT employee_id FROM public.get_team_members())
  );

CREATE POLICY "employees_all_manager" ON public.employees
  FOR ALL USING (is_manager());

-- Profiles table policies
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_select_supervisor" ON public.profiles
  FOR SELECT USING (
    is_supervisor_or_above()
    AND user_id IN (
      SELECT auth_id FROM public.employees
      WHERE id IN (SELECT employee_id FROM public.get_team_members())
    )
  );

CREATE POLICY "profiles_all_manager" ON public.profiles
  FOR ALL USING (is_manager());

-- Individual shifts table policies
CREATE POLICY "shifts_select_own" ON public.individual_shifts
  FOR SELECT USING (employee_id IN (
    SELECT id FROM public.employees WHERE auth_id = auth.uid()
  ));

CREATE POLICY "shifts_update_own" ON public.individual_shifts
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid())
    -- Only allow updating actual times
    AND (
      NEW.actual_start_time IS DISTINCT FROM OLD.actual_start_time
      OR NEW.actual_end_time IS DISTINCT FROM OLD.actual_end_time
    )
    -- Don't allow modifying other fields
    AND NEW.scheduled_start_time = OLD.scheduled_start_time
    AND NEW.scheduled_end_time = OLD.scheduled_end_time
    AND NEW.shift_type = OLD.shift_type
  );

CREATE POLICY "shifts_select_supervisor" ON public.individual_shifts
  FOR SELECT USING (
    is_supervisor_or_above()
    AND employee_id IN (SELECT employee_id FROM public.get_team_members())
  );

CREATE POLICY "shifts_update_supervisor" ON public.individual_shifts
  FOR UPDATE USING (
    is_supervisor_or_above()
    AND employee_id IN (SELECT employee_id FROM public.get_team_members())
  )
  WITH CHECK (
    employee_id IN (SELECT employee_id FROM public.get_team_members())
  );

CREATE POLICY "shifts_all_manager" ON public.individual_shifts
  FOR ALL USING (is_manager());

-- Time off requests table policies
CREATE POLICY "time_off_select_own" ON public.time_off_requests
  FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid())
  );

CREATE POLICY "time_off_insert_own" ON public.time_off_requests
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid())
  );

CREATE POLICY "time_off_update_own" ON public.time_off_requests
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid())
    -- Only allow updating if status is 'pending'
    AND status = 'pending'
  )
  WITH CHECK (
    employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid())
    -- Don't allow modifying status
    AND NEW.status = OLD.status
  );

CREATE POLICY "time_off_delete_own" ON public.time_off_requests
  FOR DELETE USING (
    employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid())
    AND status = 'pending'
  );

CREATE POLICY "time_off_select_supervisor" ON public.time_off_requests
  FOR SELECT USING (
    is_supervisor_or_above()
    AND employee_id IN (SELECT employee_id FROM public.get_team_members())
  );

CREATE POLICY "time_off_update_supervisor" ON public.time_off_requests
  FOR UPDATE USING (
    is_supervisor_or_above()
    AND employee_id IN (SELECT employee_id FROM public.get_team_members())
  )
  WITH CHECK (
    employee_id IN (SELECT employee_id FROM public.get_team_members())
    -- Only allow updating status
    AND (
      NEW.status IS DISTINCT FROM OLD.status
      AND NEW.status IN ('approved', 'rejected')
    )
    -- Don't allow modifying other fields
    AND NEW.start_date = OLD.start_date
    AND NEW.end_date = OLD.end_date
    AND NEW.reason = OLD.reason
    AND NEW.employee_id = OLD.employee_id
  );

CREATE POLICY "time_off_all_manager" ON public.time_off_requests
  FOR ALL USING (is_manager()); 