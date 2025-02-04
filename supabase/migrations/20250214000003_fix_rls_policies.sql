-- Drop existing policies
DROP POLICY IF EXISTS "Supervisors and managers can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new policies for profiles
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Supervisors and managers can view all profiles"
ON profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE auth_id = auth.uid()
        AND role IN ('supervisor', 'manager')
    )
);

-- Update employees policies to be more specific
DROP POLICY IF EXISTS "Users can view own employee record" ON employees;
DROP POLICY IF EXISTS "Users can insert their own employee record during signup" ON employees;
DROP POLICY IF EXISTS "Users can update own employee record" ON employees;

CREATE POLICY "Users can view own employee record"
ON employees FOR SELECT
USING (auth_id = auth.uid());

CREATE POLICY "Supervisors and managers can view all employee records"
ON employees FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE auth_id = auth.uid()
        AND role IN ('supervisor', 'manager')
    )
);

CREATE POLICY "Users can insert their own employee record during signup"
ON employees FOR INSERT
WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Users can update own employee record"
ON employees FOR UPDATE
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Managers can update any employee record"
ON employees FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE auth_id = auth.uid()
        AND role = 'manager'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM employees
        WHERE auth_id = auth.uid()
        AND role = 'manager'
    )
); 