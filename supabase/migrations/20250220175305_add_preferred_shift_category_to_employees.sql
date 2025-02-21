-- Add preferred_shift_category column to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS preferred_shift_category shift_category DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.employees.preferred_shift_category IS 'The employee''s preferred shift category (early, day, swing, graveyard)';

-- Add index for performance on shift category queries
CREATE INDEX IF NOT EXISTS idx_employees_preferred_shift_category ON public.employees(preferred_shift_category);

-- Create new RLS policies for preferred_shift_category if needed
DO $$ 
BEGIN
    -- Create new policies
    CREATE POLICY "employees_read_own_shift_category" 
    ON public.employees
    FOR SELECT
    TO authenticated
    USING (auth.uid() = auth_id);

    CREATE POLICY "supervisors_update_shift_category" 
    ON public.employees
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.employees e 
            WHERE e.auth_id = auth.uid() 
            AND e.role IN ('supervisor', 'manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.employees e 
            WHERE e.auth_id = auth.uid() 
            AND e.role IN ('supervisor', 'manager')
        )
    );
END $$; 