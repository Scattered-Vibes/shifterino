-- Create individual_shifts table for tracking actual hours worked
CREATE TABLE IF NOT EXISTS public.individual_shifts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    assigned_shift_id uuid REFERENCES public.assigned_shifts(id) ON DELETE SET NULL,
    date date NOT NULL,
    actual_hours_worked numeric(4,2),
    status public.shift_status NOT NULL DEFAULT 'scheduled',
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT valid_hours CHECK (actual_hours_worked > 0 AND actual_hours_worked <= 24)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_individual_shifts_employee ON public.individual_shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_individual_shifts_date ON public.individual_shifts(date);
CREATE INDEX IF NOT EXISTS idx_individual_shifts_status ON public.individual_shifts(status);

-- Add triggers
CREATE TRIGGER update_individual_shifts_updated_at
    BEFORE UPDATE ON public.individual_shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_individual_shifts_created_by
    BEFORE INSERT ON public.individual_shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_individual_shifts_updated_by
    BEFORE UPDATE ON public.individual_shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by(); 