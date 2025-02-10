-- Enable RLS on remaining tables
ALTER TABLE public.shift_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staffing_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_data ENABLE ROW LEVEL SECURITY;

-- Shift options policies (reference data)
CREATE POLICY "shift_options_read_authenticated" ON public.shift_options
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "shift_options_all_manager" ON public.shift_options
  FOR ALL USING (is_manager());

-- Staffing requirements policies
CREATE POLICY "staffing_requirements_read_authenticated" ON public.staffing_requirements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "staffing_requirements_all_manager" ON public.staffing_requirements
  FOR ALL USING (is_manager());

-- Schedule periods policies
CREATE POLICY "schedule_periods_read_authenticated" ON public.schedule_periods
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "schedule_periods_all_manager" ON public.schedule_periods
  FOR ALL USING (is_manager());

-- Schedules policies
CREATE POLICY "schedules_select_own" ON public.schedules
  FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid())
  );

CREATE POLICY "schedules_select_supervisor" ON public.schedules
  FOR SELECT USING (
    is_supervisor_or_above()
    AND employee_id IN (SELECT employee_id FROM public.get_team_members())
  );

CREATE POLICY "schedules_all_manager" ON public.schedules
  FOR ALL USING (is_manager());

-- Scheduling logs policies (audit trail)
CREATE POLICY "scheduling_logs_select_own" ON public.scheduling_logs
  FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid())
  );

CREATE POLICY "scheduling_logs_select_supervisor" ON public.scheduling_logs
  FOR SELECT USING (
    is_supervisor_or_above()
    AND employee_id IN (SELECT employee_id FROM public.get_team_members())
  );

CREATE POLICY "scheduling_logs_insert_authenticated" ON public.scheduling_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "scheduling_logs_all_manager" ON public.scheduling_logs
  FOR ALL USING (is_manager());

-- Shift assignment scores policies
CREATE POLICY "shift_scores_select_supervisor" ON public.shift_assignment_scores
  FOR SELECT USING (
    is_supervisor_or_above()
    AND employee_id IN (SELECT employee_id FROM public.get_team_members())
  );

CREATE POLICY "shift_scores_all_manager" ON public.shift_assignment_scores
  FOR ALL USING (is_manager());

-- System settings policies (service role only)
CREATE POLICY "system_settings_service_role" ON public.system_settings
  FOR ALL USING (false);

-- Test data policies (completely restricted in production)
CREATE POLICY "test_data_restricted" ON public.test_data
  FOR ALL USING (false);

-- Helper function to check if we're in a development environment
CREATE OR REPLACE FUNCTION public.is_development()
RETURNS boolean AS $$
BEGIN
  RETURN current_setting('app.settings.environment', true) = 'development';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow test data access in development
CREATE POLICY "test_data_development" ON public.test_data
  FOR ALL USING (is_development());

-- Add audit logging trigger for sensitive operations
CREATE OR REPLACE FUNCTION public.log_sensitive_operations()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO scheduling_logs (
      operation,
      table_name,
      record_id,
      employee_id,
      details
    ) VALUES (
      TG_OP,
      TG_TABLE_NAME,
      OLD.id,
      CASE 
        WHEN TG_TABLE_NAME = 'employees' THEN OLD.id
        WHEN TG_TABLE_NAME = 'schedules' THEN OLD.employee_id
        ELSE NULL
      END,
      jsonb_build_object(
        'old_data', to_jsonb(OLD),
        'changed_by', auth.uid()
      )
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if sensitive fields changed
    IF EXISTS (
      SELECT 1 FROM jsonb_each(to_jsonb(NEW))
      WHERE key NOT IN ('updated_at')
      AND jsonb_extract_path_text(to_jsonb(OLD), key) IS DISTINCT FROM 
          jsonb_extract_path_text(to_jsonb(NEW), key)
    ) THEN
      INSERT INTO scheduling_logs (
        operation,
        table_name,
        record_id,
        employee_id,
        details
      ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        NEW.id,
        CASE 
          WHEN TG_TABLE_NAME = 'employees' THEN NEW.id
          WHEN TG_TABLE_NAME = 'schedules' THEN NEW.employee_id
          ELSE NULL
        END,
        jsonb_build_object(
          'old_data', to_jsonb(OLD),
          'new_data', to_jsonb(NEW),
          'changed_by', auth.uid()
        )
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO scheduling_logs (
      operation,
      table_name,
      record_id,
      employee_id,
      details
    ) VALUES (
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      CASE 
        WHEN TG_TABLE_NAME = 'employees' THEN NEW.id
        WHEN TG_TABLE_NAME = 'schedules' THEN NEW.employee_id
        ELSE NULL
      END,
      jsonb_build_object(
        'new_data', to_jsonb(NEW),
        'created_by', auth.uid()
      )
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to sensitive tables
CREATE TRIGGER log_employee_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_operations();

CREATE TRIGGER log_schedule_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_operations();

CREATE TRIGGER log_staffing_requirement_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.staffing_requirements
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_operations(); 