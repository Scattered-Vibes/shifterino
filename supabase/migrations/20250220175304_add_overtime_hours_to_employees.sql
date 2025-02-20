-- Add overtime_hours column to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS overtime_hours numeric DEFAULT 0 NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.employees.overtime_hours IS 'Current overtime hours accumulated by the employee';

-- Add index for performance on overtime queries
CREATE INDEX IF NOT EXISTS idx_employees_overtime_hours ON public.employees(overtime_hours);

-- Create new RLS policies for overtime_hours if needed
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "employees_read_own_overtime" ON public.employees;
    DROP POLICY IF EXISTS "supervisors_update_overtime" ON public.employees;
    
    -- Create new policies
    CREATE POLICY "employees_read_own_overtime" 
    ON public.employees
    FOR SELECT
    TO authenticated
    USING (auth.uid() = auth_id);

    CREATE POLICY "supervisors_update_overtime" 
    ON public.employees
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.employees e 
            WHERE e.auth_id = auth.uid() 
            AND e.role = 'supervisor'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.employees e 
            WHERE e.auth_id = auth.uid() 
            AND e.role = 'supervisor'
        )
    );
END $$;
