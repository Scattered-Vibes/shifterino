-- Add execute_sql function for setup script
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    EXECUTE query;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION execute_sql TO authenticated;

-- RLS Helper Functions (using SECURITY DEFINER and auth.uid())
CREATE OR REPLACE FUNCTION is_manager()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.employees
    WHERE auth_id = auth.uid()
    AND role = 'manager'::employee_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_supervisor_or_above()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.employees
    WHERE auth_id = auth.uid()
    AND role IN ('supervisor'::employee_role, 'manager'::employee_role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_team_members()
RETURNS TABLE (employee_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id FROM public.employees e
  WHERE EXISTS (
    SELECT 1 FROM public.employees supervisor
    WHERE supervisor.auth_id = auth.uid()
    AND supervisor.role IN ('supervisor'::employee_role, 'manager'::employee_role)
    AND e.team_id = supervisor.team_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on non-core tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for non-core tables
CREATE POLICY teams_policy ON teams
    FOR SELECT USING (
        id IN (SELECT team_id FROM employees WHERE auth_id = auth.uid())
        OR is_supervisor_or_above()
    );

CREATE POLICY teams_modify_policy ON teams
    FOR ALL USING (is_manager());

CREATE POLICY shift_options_select_policy ON shift_options FOR SELECT USING (TRUE);
CREATE POLICY shift_options_modify_policy ON shift_options FOR ALL USING (is_manager());

CREATE POLICY staffing_requirements_select_policy ON staffing_requirements FOR SELECT USING (TRUE);
CREATE POLICY staffing_requirements_modify_policy ON staffing_requirements FOR ALL USING (is_manager());

CREATE POLICY schedules_policy ON schedules
    FOR ALL USING (is_manager());

CREATE POLICY shift_requirements_policy ON shift_requirements
    FOR ALL USING (is_manager());

-- Shifts accessible to managers and supervisors, and to the assigned employee
CREATE POLICY shifts_policy ON shifts
    FOR ALL USING (
        is_supervisor_or_above()
    );

CREATE POLICY shift_assignments_select ON shift_assignments
    FOR SELECT USING (
        user_id IN (SELECT id FROM employees WHERE auth_id = auth.uid()) OR is_supervisor_or_above()
    );

CREATE POLICY shift_assignments_insert ON shift_assignments
  FOR INSERT WITH CHECK (is_supervisor_or_above());

CREATE POLICY shift_assignments_update ON shift_assignments
  FOR UPDATE USING (is_supervisor_or_above());

CREATE POLICY shift_assignments_delete ON shift_assignments
  FOR DELETE USING (is_manager());

CREATE POLICY shift_tasks_policy ON shift_tasks
    FOR ALL USING (
        (assigned_to = auth.uid())
        OR is_supervisor_or_above()
    );

CREATE POLICY user_availability_policy ON user_availability
    FOR ALL USING (
        (user_id = auth.uid())
        OR is_supervisor_or_above()
    );

-- Time off requests can be viewed by the requester and supervisors/managers
CREATE POLICY time_off_requests_select ON time_off_requests
    FOR SELECT USING (
        user_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
        OR is_supervisor_or_above()
    );

-- Employees can create time off requests
CREATE POLICY time_off_requests_insert ON time_off_requests
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
    );

-- Employees can update/delete their OWN PENDING requests
CREATE POLICY time_off_requests_update ON time_off_requests
    FOR UPDATE USING (
        user_id IN (SELECT id FROM employees WHERE auth_id = auth.uid()) AND status = 'pending'::time_off_request_status
    ) WITH CHECK (
        user_id IN (SELECT id FROM employees WHERE auth_id = auth.uid()) AND status = 'pending'::time_off_request_status
    );

CREATE POLICY time_off_requests_delete ON time_off_requests
    FOR DELETE USING (
        user_id IN (SELECT id FROM employees WHERE auth_id = auth.uid()) AND status = 'pending'::time_off_request_status
    );

-- Supervisors and Managers can approve/reject requests
CREATE POLICY time_off_requests_approve_reject ON time_off_requests
    FOR UPDATE
    USING (is_supervisor_or_above())
    WITH CHECK (is_supervisor_or_above() AND status IN ('approved'::time_off_request_status, 'rejected'::time_off_request_status));

CREATE POLICY time_off_balances_policy ON time_off_balances
    FOR ALL USING (
        (user_id = auth.uid())
        OR is_supervisor_or_above()
    );

CREATE POLICY shift_swaps_policy ON shift_swaps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM shift_assignments sa
            WHERE sa.id = shift_swaps.assignment_id
            AND sa.user_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
        )
        OR to_user_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
        OR is_supervisor_or_above()
    );

CREATE POLICY notifications_policy ON notifications
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY messages_policy ON messages
    FOR ALL USING (
        (from_user_id = auth.uid() OR to_user_id = auth.uid())
    );

CREATE POLICY messages_policy_insert ON messages
    FOR INSERT WITH CHECK (from_user_id = auth.uid());

CREATE POLICY system_settings_policy ON system_settings
    FOR ALL USING (
      is_manager()
    );

CREATE POLICY audit_logs_policy ON audit_logs
    FOR SELECT USING (is_manager());

CREATE POLICY scheduled_reports_policy ON scheduled_reports
    FOR ALL USING (is_manager());

-- RLS policies for employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_select_policy" ON employees
    FOR SELECT
    USING (
        auth.uid() = auth_id
        OR is_supervisor_or_above()
    );

CREATE POLICY "employees_insert_policy" ON employees
    FOR INSERT
    WITH CHECK (is_manager());

CREATE POLICY "employees_update_policy" ON employees
    FOR UPDATE
    USING (is_manager())
    WITH CHECK (is_manager());

CREATE POLICY "employees_delete_policy" ON employees
    FOR DELETE
    USING (is_manager());