-- Drop and recreate trigger
DO $$
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_auth_user_created();
EXCEPTION
    WHEN others THEN
        NULL;
END $$;

-- updated_at triggers
DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_shift_options_updated_at ON public.shift_options;
CREATE TRIGGER update_shift_options_updated_at
    BEFORE UPDATE ON public.shift_options
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedule_periods_updated_at ON public.schedule_periods;
CREATE TRIGGER update_schedule_periods_updated_at
    BEFORE UPDATE ON public.schedule_periods
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_staffing_requirements_updated_at ON public.staffing_requirements;
CREATE TRIGGER update_staffing_requirements_updated_at
    BEFORE UPDATE ON public.staffing_requirements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedules_updated_at ON public.assigned_shifts;
CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON public.assigned_shifts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_time_off_requests_updated_at ON public.time_off_requests;
CREATE TRIGGER update_time_off_requests_updated_at
    BEFORE UPDATE ON public.time_off_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_shift_swap_requests_updated_at ON public.shift_swap_requests;
CREATE TRIGGER update_shift_swap_requests_updated_at
    BEFORE UPDATE ON public.shift_swap_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_on_call_assignments_updated_at ON public.on_call_assignments;
CREATE TRIGGER update_on_call_assignments_updated_at
    BEFORE UPDATE ON public.on_call_assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_on_call_activations_updated_at ON public.on_call_activations;
CREATE TRIGGER update_on_call_activations_updated_at
    BEFORE UPDATE ON public.on_call_activations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_holidays_updated_at ON public.holidays;
CREATE TRIGGER update_holidays_updated_at
    BEFORE UPDATE ON public.holidays
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_shift_pattern_rules_updated_at ON public.shift_pattern_rules;
CREATE TRIGGER update_shift_pattern_rules_updated_at
    BEFORE UPDATE ON public.shift_pattern_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- created_by and updated_by triggers
DROP TRIGGER IF EXISTS set_employees_created_by ON public.employees;
CREATE TRIGGER set_employees_created_by
    BEFORE INSERT ON public.employees
    FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_employees_updated_by ON public.employees;
CREATE TRIGGER set_employees_updated_by
    BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

DROP TRIGGER IF EXISTS set_shift_options_created_by ON public.shift_options;
CREATE TRIGGER set_shift_options_created_by
    BEFORE INSERT ON public.shift_options
    FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_shift_options_updated_by ON public.shift_options;
CREATE TRIGGER set_shift_options_updated_by
    BEFORE UPDATE ON public.shift_options
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

DROP TRIGGER IF EXISTS set_schedule_periods_created_by ON public.schedule_periods;
CREATE TRIGGER set_schedule_periods_created_by
    BEFORE INSERT ON public.schedule_periods
    FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_schedule_periods_updated_by ON public.schedule_periods;
CREATE TRIGGER set_schedule_periods_updated_by
    BEFORE UPDATE ON public.schedule_periods
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

DROP TRIGGER IF EXISTS set_staffing_requirements_created_by ON public.staffing_requirements;
CREATE TRIGGER set_staffing_requirements_created_by
    BEFORE INSERT ON public.staffing_requirements
    FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_staffing_requirements_updated_by ON public.staffing_requirements;
CREATE TRIGGER set_staffing_requirements_updated_by
    BEFORE UPDATE ON public.staffing_requirements
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

DROP TRIGGER IF EXISTS set_schedules_created_by ON public.assigned_shifts;
CREATE TRIGGER set_schedules_created_by
    BEFORE INSERT ON public.assigned_shifts
    FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_schedules_updated_by ON public.assigned_shifts;
CREATE TRIGGER set_schedules_updated_by
    BEFORE UPDATE ON public.assigned_shifts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

DROP TRIGGER IF EXISTS set_time_off_requests_created_by ON public.time_off_requests;
CREATE TRIGGER set_time_off_requests_created_by
    BEFORE INSERT ON public.time_off_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_time_off_requests_updated_by ON public.time_off_requests;
CREATE TRIGGER set_time_off_requests_updated_by
    BEFORE UPDATE ON public.time_off_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

DROP TRIGGER IF EXISTS set_shift_swap_requests_created_by ON public.shift_swap_requests;
CREATE TRIGGER set_shift_swap_requests_created_by
    BEFORE INSERT ON public.shift_swap_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_shift_swap_requests_updated_by ON public.shift_swap_requests;
CREATE TRIGGER set_shift_swap_requests_updated_by
    BEFORE UPDATE ON public.shift_swap_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

DROP TRIGGER IF EXISTS set_on_call_assignments_created_by ON public.on_call_assignments;
CREATE TRIGGER set_on_call_assignments_created_by
    BEFORE INSERT ON public.on_call_assignments
    FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_on_call_assignments_updated_by ON public.on_call_assignments;
CREATE TRIGGER set_on_call_assignments_updated_by
    BEFORE UPDATE ON public.on_call_assignments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

DROP TRIGGER IF EXISTS set_on_call_activations_created_by ON public.on_call_activations;
CREATE TRIGGER set_on_call_activations_created_by
    BEFORE INSERT ON public.on_call_activations
    FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_on_call_activations_updated_by ON public.on_call_activations;
CREATE TRIGGER set_on_call_activations_updated_by
    BEFORE UPDATE ON public.on_call_activations
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

DROP TRIGGER IF EXISTS set_holidays_created_by ON public.holidays;
CREATE TRIGGER set_holidays_created_by
    BEFORE INSERT ON public.holidays
    FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_holidays_updated_by ON public.holidays;
CREATE TRIGGER set_holidays_updated_by
    BEFORE UPDATE ON public.holidays
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

DROP TRIGGER IF EXISTS set_shift_pattern_rules_created_by ON public.shift_pattern_rules;
CREATE TRIGGER set_shift_pattern_rules_created_by
    BEFORE INSERT ON public.shift_pattern_rules
    FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_shift_pattern_rules_updated_by ON public.shift_pattern_rules;
CREATE TRIGGER set_shift_pattern_rules_updated_by
    BEFORE UPDATE ON public.shift_pattern_rules
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_by(); 