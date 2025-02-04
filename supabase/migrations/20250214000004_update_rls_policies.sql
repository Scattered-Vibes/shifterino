-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Supervisors and managers can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own employee record" ON employees;
DROP POLICY IF EXISTS "Supervisors and managers can view all employee records" ON employees;
DROP POLICY IF EXISTS "Users can insert their own employee record during signup" ON employees;
DROP POLICY IF EXISTS "Users can update own employee record" ON employees;
DROP POLICY IF EXISTS "Managers can update any employee record" ON employees;

-- Enable RLS on both tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Profiles Table Policies
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Supervisors and managers can view all profiles"
ON profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid() AND role IN ('supervisor', 'manager')
    )
);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Employees Table Policies
CREATE POLICY "Users can view own employee record"
ON employees FOR SELECT
USING (auth.uid() = auth_id);

CREATE POLICY "Supervisors and managers can view all employee records"
ON employees FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid() AND role IN ('supervisor', 'manager')
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
        FROM profiles
        WHERE id = auth.uid() AND role = 'manager'
    )
); 