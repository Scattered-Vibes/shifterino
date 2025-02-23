-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table first since it's referenced by employees
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_info JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add updated_at trigger
CREATE TRIGGER set_timestamp_organizations
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create base tables
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    level INTEGER,
    weekly_hour_limit INTEGER,
    description TEXT,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT roles_name_unique UNIQUE (name)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT permissions_name_unique UNIQUE (name)
);

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    manager_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT departments_org_name_unique UNIQUE (organization_id, name)
);

-- Create employees table
CREATE TABLE employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    employee_id TEXT NOT NULL UNIQUE,
    role employee_role NOT NULL,
    shift_pattern shift_pattern_type NOT NULL,
    preferred_shift_category shift_category NOT NULL,
    weekly_hours_cap INTEGER NOT NULL DEFAULT 40 CHECK (weekly_hours_cap BETWEEN 0 AND 60),
    max_overtime_hours INTEGER NOT NULL DEFAULT 0 CHECK (max_overtime_hours BETWEEN 0 AND 20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create junction tables
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE department_members (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, department_id)
);

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_departments_org ON departments(organization_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX idx_department_members_user ON department_members(user_id);
CREATE INDEX idx_department_members_department ON department_members(department_id);
CREATE INDEX idx_employees_auth_id ON employees(auth_id);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_shift_pattern ON employees(shift_pattern);
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_preferred_shift_category ON employees(preferred_shift_category);

-- Enable RLS on tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY organizations_policy ON organizations
    FOR ALL USING (true);

CREATE POLICY departments_policy ON departments
    FOR ALL USING (true);

CREATE POLICY roles_policy ON roles
    FOR ALL USING (is_manager());

CREATE POLICY permissions_policy ON permissions
    FOR ALL USING (is_manager());

CREATE POLICY department_members_policy ON department_members
    FOR ALL USING (
        (user_id = auth.uid() AND department_id IN (SELECT id FROM departments))
        OR is_manager()
    );

-- Employee RLS policies
CREATE POLICY "service_role_all"
    ON employees
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "users_read_own"
    ON employees
    FOR SELECT
    TO authenticated
    USING (auth_id = auth.uid());

CREATE POLICY "users_update_own"
    ON employees
    FOR UPDATE
    TO authenticated
    USING (auth_id = auth.uid())
    WITH CHECK (
        auth_id = auth.uid() AND
        role = (SELECT role FROM employees WHERE auth_id = auth.uid()) AND
        employee_id = (SELECT employee_id FROM employees WHERE auth_id = auth.uid()) AND
        auth_id = (SELECT auth_id FROM employees WHERE auth_id = auth.uid())
    );

CREATE POLICY employees_insert ON employees
FOR INSERT WITH CHECK (
    is_manager()
);

CREATE POLICY employees_update ON employees
  FOR UPDATE USING (
    is_supervisor_or_above()
  );

CREATE POLICY employees_delete ON employees
    FOR DELETE USING (is_manager());

-- Grant necessary permissions
GRANT ALL ON employees TO service_role;
GRANT SELECT, UPDATE ON employees TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated; 