-- 20250214000001_rls_and_security.sql
--
-- Consolidated Row Level Security (RLS) and Security Policies
--

-- Enable RLS on core and scheduling tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staffing_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_pattern_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Security helper functions
CREATE OR REPLACE FUNCTION public.is_manager(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = user_id
          AND (u.raw_user_meta_data->>'role')::text = 'manager'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_update_employee(employee_auth_id uuid)
RETURNS boolean AS $$
BEGIN
    IF auth.uid() = employee_auth_id THEN
        RETURN true;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = auth.uid()
          AND (u.raw_user_meta_data->>'role')::text = 'manager'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow profile creation during signup" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- RLS policies for employees table
DROP POLICY IF EXISTS "Users can view own employee record" ON public.employees;
DROP POLICY IF EXISTS "Managers can view all employee records" ON public.employees;
DROP POLICY IF EXISTS "Supervisors can view all employee records" ON public.employees;
DROP POLICY IF EXISTS "Users can insert their own employee record during signup" ON public.employees;
DROP POLICY IF EXISTS "Users can update own employee record" ON public.employees;
DROP POLICY IF EXISTS "Managers can update any employee record" ON public.employees;

CREATE POLICY "Users can view own employee record" ON public.employees
    FOR SELECT
    USING (auth.uid() = auth_id);

CREATE POLICY "Managers can view all employee records" ON public.employees
    FOR SELECT
    USING (public.is_manager(auth.uid()));

CREATE POLICY "Supervisors can view all employee records" ON public.employees
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
              AND (u.raw_user_meta_data->>'role')::text = 'supervisor'
        )
    );

CREATE POLICY "Users can insert their own employee record during signup" ON public.employees
    FOR INSERT
    WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can update own employee record" ON public.employees
    FOR UPDATE
    USING (auth.uid() = auth_id)
    WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Managers can update any employee record" ON public.employees
    FOR UPDATE
    USING (public.can_update_employee(auth_id));

-- RLS policies for scheduling related tables (examples; extend as needed)
CREATE POLICY "View own shifts" ON public.individual_shifts
    FOR SELECT
    USING (auth.uid() IN (SELECT auth_id FROM public.employees WHERE id = employee_id));

CREATE POLICY "View own requests" ON public.time_off_requests
    FOR SELECT
    USING (auth.uid() IN (SELECT auth_id FROM public.employees WHERE id = employee_id));

CREATE POLICY "View non-sensitive settings" ON public.system_settings
    FOR SELECT
    USING (auth.role() = 'authenticated' AND NOT is_encrypted);

CREATE POLICY "Manage settings" ON public.system_settings
    FOR ALL
    USING (public.is_manager(auth.uid()));

-- Grant additional execute permissions on public functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;