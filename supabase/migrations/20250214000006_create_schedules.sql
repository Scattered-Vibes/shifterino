-- Create set_updated_at function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create schedules table
CREATE TABLE public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    employee_id UUID NOT NULL REFERENCES public.employees(auth_id),
    shift_type TEXT NOT NULL CHECK (shift_type IN ('day_early', 'day', 'swing', 'graveyard')),
    shift_pattern public.shift_pattern NOT NULL,
    is_supervisor BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    updated_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Add RLS policies
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own schedules"
    ON public.schedules
    FOR SELECT
    USING (auth.uid() = employee_id);

CREATE POLICY "Supervisors can view all schedules"
    ON public.schedules
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE auth_id = auth.uid()
            AND role = 'supervisor'
        )
    );

CREATE POLICY "Supervisors can manage schedules"
    ON public.schedules
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE auth_id = auth.uid()
            AND role = 'supervisor'
        )
    );

-- Add indexes for performance
CREATE INDEX idx_schedules_employee_id ON public.schedules(employee_id);
CREATE INDEX idx_schedules_date_range ON public.schedules(start_date, end_date);
CREATE INDEX idx_schedules_shift_type ON public.schedules(shift_type);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Grant permissions
GRANT SELECT ON public.schedules TO authenticated;
GRANT ALL ON public.schedules TO service_role; 