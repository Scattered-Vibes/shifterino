-- seed_roles.sql
-- Define roles and permissions for the scheduling system

-- Create application roles
DO $$ 
BEGIN
    -- Manager Role
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'manager') THEN
        CREATE ROLE manager;
    END IF;
    
    -- Supervisor Role
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supervisor') THEN
        CREATE ROLE supervisor;
    END IF;
    
    -- Dispatcher Role
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dispatcher') THEN
        CREATE ROLE dispatcher;
    END IF;
END
$$;

-- Grant base permissions to all roles
GRANT USAGE ON SCHEMA public TO manager, supervisor, dispatcher;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO manager, supervisor, dispatcher;

-- Manager permissions (full access)
GRANT ALL ON ALL TABLES IN SCHEMA public TO manager;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO manager;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO manager;

-- Supervisor permissions
GRANT INSERT, UPDATE, DELETE ON 
    shift_assignments,
    shift_tasks,
    time_off_requests,
    shift_swaps,
    messages,
    notifications
TO supervisor;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO supervisor;

-- Dispatcher permissions
GRANT INSERT, UPDATE ON 
    time_off_requests,
    shift_swaps,
    messages
TO dispatcher;

-- Set search path
ALTER ROLE manager SET search_path TO public;
ALTER ROLE supervisor SET search_path TO public;
ALTER ROLE dispatcher SET search_path TO public;

-- Create test users with roles
DO $$ 
DECLARE
    manager_id uuid;
    supervisor_id uuid;
    dispatcher_id uuid;
    default_team_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Manager
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'manager@example.com') THEN
        SELECT id INTO manager_id FROM auth.sign_up(
            'manager@example.com',
            'manager123',
            '{"role": "manager"}'::jsonb
        );

        INSERT INTO public.employees (
            id,
            auth_id,
            employee_id,
            first_name,
            last_name,
            role,
            team_id,
            shift_pattern
        ) VALUES (
            uuid_generate_v4(),
            manager_id,
            'EMP' || LPAD(CAST(nextval('employee_id_seq') as TEXT), 8, '0'),
            'Manager',
            'User',
            'manager',
            default_team_id,
            'pattern_a'
        );
    END IF;

    -- Supervisor
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'supervisor@example.com') THEN
        SELECT id INTO supervisor_id FROM auth.sign_up(
            'supervisor@example.com',
            'supervisor123',
            '{"role": "supervisor"}'::jsonb
        );

        INSERT INTO public.employees (
            id,
            auth_id,
            employee_id,
            first_name,
            last_name,
            role,
            team_id,
            shift_pattern
        ) VALUES (
            uuid_generate_v4(),
            supervisor_id,
            'EMP' || LPAD(CAST(nextval('employee_id_seq') as TEXT), 8, '0'),
            'Supervisor',
            'User',
            'supervisor',
            default_team_id,
            'pattern_b'
        );
    END IF;

    -- Dispatcher
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'dispatcher@example.com') THEN
        SELECT id INTO dispatcher_id FROM auth.sign_up(
            'dispatcher@example.com',
            'dispatcher123',
            '{"role": "dispatcher"}'::jsonb
        );

        INSERT INTO public.employees (
            id,
            auth_id,
            employee_id,
            first_name,
            last_name,
            role,
            team_id,
            shift_pattern
        ) VALUES (
            uuid_generate_v4(),
            dispatcher_id,
            'EMP' || LPAD(CAST(nextval('employee_id_seq') as TEXT), 8, '0'),
            'Dispatcher',
            'User',
            'dispatcher',
            default_team_id,
            'pattern_a'
        );
    END IF;
END
$$; 