-- Migration to fix RLS recursion issues
-- Up Migration

-- 1. Create function to check if user is manager
CREATE OR REPLACE FUNCTION is_manager(user_id text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM auth.users u
        WHERE u.id::text = user_id
        AND (u.raw_user_meta_data->>'role')::text = 'manager'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create function to check if user can update employee
CREATE OR REPLACE FUNCTION can_update_employee(employee_auth_id text)
RETURNS boolean AS $$
BEGIN
    -- User can update their own record
    IF auth.uid()::text = employee_auth_id THEN
        RETURN true;
    END IF;

    -- Managers can update any record
    RETURN EXISTS (
        SELECT 1
        FROM auth.users u
        WHERE u.id = auth.uid()
        AND (u.raw_user_meta_data->>'role')::text = 'manager'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Replace problematic email validation
DROP TRIGGER IF EXISTS validate_employee_email_trigger ON employees;
DROP FUNCTION IF EXISTS validate_employee_email();

CREATE OR REPLACE FUNCTION validate_employee_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple validation without querying employees table
    IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_employee_email_trigger
BEFORE INSERT OR UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION validate_employee_email();

-- 4. Drop all existing policies
DROP POLICY IF EXISTS "Managers can update any employee record" ON employees;
DROP POLICY IF EXISTS "Managers can update all employees" ON employees;
DROP POLICY IF EXISTS "Supervisors and managers can view all employees" ON employees;
DROP POLICY IF EXISTS "View own employee record" ON employees;
DROP POLICY IF EXISTS "Users can view own employee record" ON employees;
DROP POLICY IF EXISTS "Users can insert their own employee record during signup" ON employees;
DROP POLICY IF EXISTS "Users can update own employee record" ON employees;

-- 5. Create new policies
-- Allow users to view their own record
CREATE POLICY "Users can view own employee record"
ON employees FOR SELECT
USING (auth.uid() = auth_id);

-- Allow managers to view all records
CREATE POLICY "Managers can view all employee records"
ON employees FOR SELECT
USING (is_manager(auth.uid()::text));

-- Allow supervisors to view all records
CREATE POLICY "Supervisors can view all employee records"
ON employees FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM auth.users u
        WHERE u.id = auth.uid()
        AND (u.raw_user_meta_data->>'role')::text = 'supervisor'
    )
);

-- Allow users to insert their own record during signup
CREATE POLICY "Users can insert their own employee record during signup"
ON employees FOR INSERT
WITH CHECK (auth.uid() = auth_id);

-- Allow managers and users to update records based on role
CREATE POLICY "Managers can update any employee record"
ON employees FOR UPDATE
USING (can_update_employee(auth_id::text));

-- Down Migration
-- In case we need to rollback these changes
COMMENT ON FUNCTION is_manager(text) IS 'To rollback:
DROP POLICY IF EXISTS "Users can view own employee record" ON employees;
DROP POLICY IF EXISTS "Managers can view all employee records" ON employees;
DROP POLICY IF EXISTS "Supervisors can view all employee records" ON employees;
DROP POLICY IF EXISTS "Users can insert their own employee record during signup" ON employees;
DROP POLICY IF EXISTS "Managers can update any employee record" ON employees;
DROP FUNCTION IF EXISTS is_manager(text);
DROP FUNCTION IF EXISTS can_update_employee(text);
DROP TRIGGER IF EXISTS validate_employee_email_trigger ON employees;
DROP FUNCTION IF EXISTS validate_email_validation();'; 