-- Create shift status enum
CREATE TYPE public.shift_status AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'missed',
    'cancelled'
);

-- Rename and enhance schedules table to individual_shifts
ALTER TABLE public.schedules RENAME TO individual_shifts;

-- Add new columns to individual_shifts
ALTER TABLE public.individual_shifts
    ADD COLUMN status public.shift_status NOT NULL DEFAULT 'scheduled',
    ADD COLUMN actual_start_time TIMESTAMPTZ,
    ADD COLUMN actual_end_time TIMESTAMPTZ,
    ADD COLUMN break_start_time TIMESTAMPTZ,
    ADD COLUMN break_end_time TIMESTAMPTZ,
    ADD COLUMN notes TEXT,
    ADD COLUMN is_regular_schedule BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN supervisor_approved_by UUID REFERENCES public.employees(id),
    ADD COLUMN supervisor_approved_at TIMESTAMPTZ;

-- Add constraints
ALTER TABLE public.individual_shifts
    ADD CONSTRAINT valid_break_times 
        CHECK (
            (break_start_time IS NULL AND break_end_time IS NULL) OR
            (break_start_time IS NOT NULL AND break_end_time IS NOT NULL AND
             break_start_time < break_end_time)
        ),
    ADD CONSTRAINT valid_actual_times 
        CHECK (
            (actual_start_time IS NULL AND actual_end_time IS NULL) OR
            (actual_start_time IS NOT NULL AND actual_end_time IS NOT NULL AND
             actual_start_time < actual_end_time)
        ),
    ADD CONSTRAINT supervisor_approval_complete
        CHECK (
            (supervisor_approved_by IS NULL AND supervisor_approved_at IS NULL) OR
            (supervisor_approved_by IS NOT NULL AND supervisor_approved_at IS NOT NULL)
        );

-- Create index for common queries
CREATE INDEX idx_individual_shifts_date ON public.individual_shifts(date);
CREATE INDEX idx_individual_shifts_employee_date ON public.individual_shifts(employee_id, date);
CREATE INDEX idx_individual_shifts_status ON public.individual_shifts(status);

-- Update trigger name
ALTER TRIGGER update_schedules_updated_at
ON public.individual_shifts
RENAME TO update_individual_shifts_updated_at;

-- Add trigger for status changes
CREATE OR REPLACE FUNCTION public.log_shift_status_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        -- Here we could add logging logic if needed
        -- For now, just update the updated_at timestamp
        NEW.updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_shift_status_changes
    BEFORE UPDATE OF status ON public.individual_shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.log_shift_status_changes();

-- Grant permissions
GRANT ALL ON public.individual_shifts TO authenticated;
GRANT USAGE ON TYPE public.shift_status TO authenticated; 