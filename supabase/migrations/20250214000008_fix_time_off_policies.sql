-- Drop existing policies
DROP POLICY IF EXISTS "View own requests" ON public.time_off_requests;
DROP POLICY IF EXISTS "View all requests" ON public.time_off_requests;
DROP POLICY IF EXISTS "Create requests" ON public.time_off_requests;
DROP POLICY IF EXISTS "Update own requests" ON public.time_off_requests;
DROP POLICY IF EXISTS "Manage all requests" ON public.time_off_requests;

-- Create comprehensive policies for time_off_requests
CREATE POLICY "View own requests" ON public.time_off_requests
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
    );

CREATE POLICY "View all requests" ON public.time_off_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE auth_id = auth.uid()
            AND role IN ('supervisor', 'manager')
        )
    );

CREATE POLICY "Create requests" ON public.time_off_requests
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
    );

CREATE POLICY "Update own requests" ON public.time_off_requests
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid()) AND
        status = 'pending'
    );

CREATE POLICY "Manage all requests" ON public.time_off_requests
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE auth_id = auth.uid()
            AND role IN ('supervisor', 'manager')
        )
    ); 