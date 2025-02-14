-- Migration renamed from 20240317000006 to 20250214100001
-- Enable Row Level Security on all relevant tables
-- Consolidated from individual migration files:
-- 20240317000006, 20240317000007, 20240317000009, 20240317000010,
-- 20240317000011, 20240317000012, 20240317000014, 20240317000015,
-- 20240317000016, 20240317000017

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staffing_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.on_call_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.on_call_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_pattern_rules ENABLE ROW LEVEL SECURITY;

-- Permissions and RLS Policies
-- Originally from 20240317000018_rls_and_final_permissions.sql

-- Grant permissions on the auth schema
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres, service_role;

-- Grant specific permissions to anon and authenticated roles on auth schema tables
GRANT SELECT, INSERT ON TABLE auth.users TO anon; -- Added INSERT for signups
GRANT SELECT, UPDATE ON TABLE auth.users TO authenticated; --added UPDATE for user edits
GRANT SELECT ON TABLE auth.refresh_tokens TO anon, authenticated;
GRANT SELECT ON TABLE auth.sessions TO anon, authenticated;
GRANT SELECT ON TABLE auth.mfa_factors TO anon, authenticated;
GRANT SELECT ON TABLE auth.mfa_challenges TO anon, authenticated;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO anon, authenticated;

-- Grant permissions on the public schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- Grant select on all tables to anon
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant select, insert, and update on all tables to authenticated
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant execute permissions on auth functions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA auth TO anon, authenticated; -- Grant USAGE on sequences
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.email() TO anon, authenticated;

-- Drop existing policies
DROP POLICY IF EXISTS "Employees can view their own data" ON public.employees;
DROP POLICY IF EXISTS "Supervisors and Managers can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Managers can update employee roles" ON public.employees;
DROP POLICY IF EXISTS "Employees can view all shift options" ON public.shift_options;
DROP POLICY IF EXISTS "Employees can view their own shift assignments" ON public.assigned_shifts;
DROP POLICY IF EXISTS "Supervisors and Managers can view all shift assignments" ON public.assigned_shifts;
DROP POLICY IF EXISTS "Managers can insert shift assignments" ON public.assigned_shifts;
DROP POLICY IF EXISTS "Managers can update shift assignments" ON public.assigned_shifts;
DROP POLICY IF EXISTS "Employees can view their own schedules" ON public.assigned_shifts;
DROP POLICY IF EXISTS "Managers and Supervisors can view all schedules" ON public.assigned_shifts;
DROP POLICY IF EXISTS "Managers can insert schedules" ON public.assigned_shifts;
DROP POLICY IF EXISTS "Managers can update schedules" ON public.assigned_shifts;
DROP POLICY IF EXISTS "Employees can view their own time off requests" ON public.time_off_requests;
DROP POLICY IF EXISTS "Managers can view all time off requests" ON public.time_off_requests;
DROP POLICY IF EXISTS "Employees can insert their own time off requests" ON public.time_off_requests;
DROP POLICY IF EXISTS "Managers can update time off requests" ON public.time_off_requests;
DROP POLICY IF EXISTS "Employees can view their own on-call assignments" ON public.on_call_assignments;
DROP POLICY IF EXISTS "Managers and Supervisors can view all on-call assignments" ON public.on_call_assignments;
DROP POLICY IF EXISTS "Managers can insert on-call assignments" ON public.on_call_assignments;
DROP POLICY IF EXISTS "Managers can update on-call assignments" ON public.on_call_assignments;
DROP POLICY IF EXISTS "Employees can view their own on-call activations" ON public.on_call_activations;
DROP POLICY IF EXISTS "Managers and Supervisors can view all on-call activations" ON public.on_call_activations;
DROP POLICY IF EXISTS "Managers can insert on-call activations" ON public.on_call_activations;
DROP POLICY IF EXISTS "Managers can update on-call activations" ON public.on_call_activations;
DROP POLICY IF EXISTS "Employees can view all holidays" ON public.holidays;
DROP POLICY IF EXISTS "Managers can insert holidays" ON public.holidays;
DROP POLICY IF EXISTS "Managers can update holidays" ON public.holidays;
DROP POLICY IF EXISTS "Employees can view their own shift pattern rules" ON public.shift_pattern_rules;
DROP POLICY IF EXISTS "Managers and Supervisors can view all shift pattern rules" ON public.shift_pattern_rules;
DROP POLICY IF EXISTS "Managers can insert shift pattern rules" ON public.shift_pattern_rules;
DROP POLICY IF EXISTS "Managers can update shift pattern rules" ON public.shift_pattern_rules;

-- RLS Policies for public.employees
CREATE POLICY "Employees can view their own data" ON public.employees FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "Supervisors and Managers can view all employees" ON public.employees FOR SELECT USING ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) IN ('supervisor', 'manager'));
CREATE POLICY "Managers can update employee roles" ON public.employees FOR UPDATE USING ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) = 'manager') WITH CHECK (role IN ('dispatcher', 'supervisor', 'manager'));

-- RLS Policies for public.shift_options
CREATE POLICY "Employees can view all shift options" ON public.shift_options FOR SELECT USING (true);

-- RLS Policies for public.assigned_shifts
CREATE POLICY "Employees can view their own shift assignments" ON public.assigned_shifts FOR SELECT USING (employee_id = (SELECT id FROM public.employees WHERE auth_id = auth.uid()));
CREATE POLICY "Supervisors and Managers can view all shift assignments" ON public.assigned_shifts FOR SELECT USING ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) IN ('supervisor', 'manager'));
CREATE POLICY "Managers can insert shift assignments" ON public.assigned_shifts FOR INSERT WITH CHECK ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) = 'manager');
CREATE POLICY "Managers can update shift assignments" ON public.assigned_shifts FOR UPDATE USING ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) = 'manager');

-- RLS Policies for public.time_off_requests
CREATE POLICY "Employees can view their own time off requests" ON public.time_off_requests FOR SELECT USING (employee_id = (SELECT id FROM public.employees WHERE auth_id = auth.uid()));
CREATE POLICY "Managers can view all time off requests" ON public.time_off_requests FOR SELECT USING ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) = 'manager');
CREATE POLICY "Employees can insert their own time off requests" ON public.time_off_requests FOR INSERT WITH CHECK (employee_id = (SELECT id FROM public.employees WHERE auth_id = auth.uid()));
CREATE POLICY "Managers can update time off requests" ON public.time_off_requests FOR UPDATE USING ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) = 'manager');

-- RLS Policies for public.on_call_assignments
CREATE POLICY "Employees can view their own on-call assignments" ON public.on_call_assignments FOR SELECT USING (employee_id = (SELECT id FROM public.employees WHERE auth_id = auth.uid()));
CREATE POLICY "Managers and Supervisors can view all on-call assignments" ON public.on_call_assignments FOR SELECT USING ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) IN ('manager', 'supervisor'));
CREATE POLICY "Managers can insert on-call assignments" ON public.on_call_assignments FOR INSERT WITH CHECK ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) = 'manager');
CREATE POLICY "Managers can update on-call assignments" ON public.on_call_assignments FOR UPDATE USING ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) = 'manager');

-- RLS Policies for public.on_call_activations
CREATE POLICY "Employees can view their own on-call activations" ON public.on_call_activations FOR SELECT USING (
    assignment_id IN (SELECT id FROM public.on_call_assignments WHERE employee_id = (SELECT id FROM public.employees WHERE auth_id = auth.uid()))
);
CREATE POLICY "Managers and Supervisors can view all on-call activations" ON public.on_call_activations FOR SELECT USING ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) IN ('manager', 'supervisor'));
CREATE POLICY "Managers can insert on-call activations" ON public.on_call_activations FOR INSERT WITH CHECK ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) = 'manager');
CREATE POLICY "Managers can update on-call activations" ON public.on_call_activations FOR UPDATE USING ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) = 'manager');

--RLS Policies for public.holidays
CREATE POLICY "Employees can view all holidays" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Managers can insert holidays" ON public.holidays FOR INSERT WITH CHECK ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) = 'manager');
CREATE POLICY "Managers can update holidays" ON public.holidays FOR UPDATE USING ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) = 'manager');

--RLS Policies for public.shift_pattern_rules
CREATE POLICY "Employees can view their own shift pattern rules" ON public.shift_pattern_rules FOR SELECT USING (employee_id = (SELECT id FROM public.employees WHERE auth_id = auth.uid()));
CREATE POLICY "Managers and Supervisors can view all shift pattern rules" ON public.shift_pattern_rules FOR SELECT USING ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) IN ('manager', 'supervisor'));
CREATE POLICY "Managers can insert shift pattern rules" ON public.shift_pattern_rules FOR INSERT WITH CHECK ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) = 'manager');
CREATE POLICY "Managers can update shift pattern rules" ON public.shift_pattern_rules FOR UPDATE USING ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) = 'manager');