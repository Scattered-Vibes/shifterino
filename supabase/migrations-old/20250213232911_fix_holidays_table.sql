-- Drop existing holidays table if it exists
DROP TABLE IF EXISTS public.holidays;

-- Create holidays table with proper schema
CREATE TABLE IF NOT EXISTS public.holidays (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('FEDERAL', 'STATE', 'LOCAL', 'CUSTOM')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- Add unique constraint on date and name
ALTER TABLE public.holidays ADD CONSTRAINT unique_holiday_date_name UNIQUE (date, name);

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Employees can view all holidays." ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Managers can insert holidays" ON public.holidays FOR INSERT WITH CHECK ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) = 'manager');
CREATE POLICY "Managers can update holidays" ON public.holidays FOR UPDATE USING ((SELECT role FROM public.employees WHERE auth_id = auth.uid()) = 'manager');

-- Add triggers for updated_at, created_by, and updated_by
DROP TRIGGER IF EXISTS update_holidays_updated_at ON public.holidays;
CREATE TRIGGER update_holidays_updated_at
    BEFORE UPDATE ON public.holidays
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_holidays_created_by ON public.holidays;
CREATE TRIGGER set_holidays_created_by
    BEFORE INSERT ON public.holidays
    FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_holidays_updated_by ON public.holidays;
CREATE TRIGGER set_holidays_updated_by
    BEFORE UPDATE ON public.holidays
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_by(); 