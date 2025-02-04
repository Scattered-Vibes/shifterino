-- Drop existing policies and functions to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Supervisors and managers can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own employee record" ON employees;
DROP POLICY IF EXISTS "Supervisors and managers can view all employee records" ON employees;
DROP POLICY IF EXISTS "Users can insert their own employee record during signup" ON employees;
DROP POLICY IF EXISTS "Users can update own employee record" ON employees;
DROP POLICY IF EXISTS "Managers can update any employee record" ON employees;

-- Drop helper functions that are no longer needed
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_supervisor_or_above() CASCADE;
DROP FUNCTION IF EXISTS is_manager() CASCADE;

-- Enable RLS on both tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Profiles Table Policies (simplified, no role checks)
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow insert during signup
CREATE POLICY "Allow profile creation during signup"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Employees Table Policies (including role-based access)
CREATE POLICY "Users can view own employee record"
ON employees FOR SELECT
USING (auth.uid() = auth_id);

CREATE POLICY "Supervisors and managers can view all employee records"
ON employees FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM employees e
        WHERE e.auth_id = auth.uid() 
        AND e.role IN ('supervisor', 'manager')
    )
);

CREATE POLICY "Users can insert their own employee record during signup"
ON employees FOR INSERT
WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can update own employee record"
ON employees FOR UPDATE
USING (auth.uid() = auth_id)
WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Managers can update any employee record"
ON employees FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM employees e
        WHERE e.auth_id = auth.uid() 
        AND e.role = 'manager'
    )
); 