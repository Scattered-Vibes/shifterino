-- Drop existing indexes to avoid conflicts
DROP INDEX IF EXISTS idx_individual_shifts_employee_date;
DROP INDEX IF EXISTS idx_individual_shifts_status;
DROP INDEX IF EXISTS idx_time_off_requests_date_range;
DROP INDEX IF EXISTS idx_schedule_periods_active;

-- Add indexes exactly as required by tests
CREATE INDEX idx_individual_shifts_employee_date
ON public.individual_shifts (employee_id, date);

CREATE INDEX idx_individual_shifts_status
ON public.individual_shifts (status);

CREATE INDEX idx_time_off_requests_date_range
ON public.time_off_requests (start_date, end_date);

CREATE INDEX idx_schedule_periods_active
ON public.schedule_periods (is_active)
WHERE is_active = true;

-- Add supporting indexes for performance
CREATE INDEX idx_individual_shifts_schedule_period
ON public.individual_shifts (schedule_period_id);

CREATE INDEX idx_individual_shifts_shift_option
ON public.individual_shifts (shift_option_id);

CREATE INDEX idx_individual_shifts_actual_times
ON public.individual_shifts (actual_start_time, actual_end_time); 