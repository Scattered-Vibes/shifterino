-- Begin transaction and plan the tests
BEGIN;
SELECT plan(50);

-- Clean up any existing test data
SELECT tests.cleanup_test_data();

-- Create test users and store their IDs
DO $$
DECLARE
    manager_id uuid;
    supervisor_id uuid;
    dispatcher_id uuid;
    dispatcher2_id uuid;
BEGIN
    -- Create users in auth.users table
    manager_id := tests.create_supabase_user('test.manager@example.com');
    supervisor_id := tests.create_supabase_user('test.supervisor@example.com');
    dispatcher_id := tests.create_supabase_user('test.dispatcher@example.com');
    dispatcher2_id := tests.create_supabase_user('test.dispatcher2@example.com');

    -- Create test teams
    INSERT INTO public.teams (id, name, description)
    VALUES 
        ('99999999-9999-9999-9999-999999999999', 'Team A', 'Test Team A'),
        ('88888888-8888-8888-8888-888888888888', 'Team B', 'Test Team B');

    -- Create test employees
    INSERT INTO public.employees (id, auth_id, first_name, last_name, email, role, shift_pattern, team_id)
    VALUES 
        ('11111111-1111-1111-1111-111111111111', manager_id, 'Test', 'Manager', 'test.manager@example.com', 'manager', '4x10', null),
        ('22222222-2222-2222-2222-222222222222', supervisor_id, 'Test', 'Supervisor', 'test.supervisor@example.com', 'supervisor', '4x10', '99999999-9999-9999-9999-999999999999'),
        ('33333333-3333-3333-3333-333333333333', dispatcher_id, 'Test', 'Dispatcher', 'test.dispatcher@example.com', 'dispatcher', '3x12_plus_4', '99999999-9999-9999-9999-999999999999'),
        ('44444444-4444-4444-4444-444444444444', dispatcher2_id, 'Test', 'Dispatcher2', 'test.dispatcher2@example.com', 'dispatcher', '4x10', '88888888-8888-8888-8888-888888888888');

    -- Create test shift options
    INSERT INTO public.shift_options (id, name, category, start_time, end_time, duration_hours)
    VALUES 
        ('66666666-6666-6666-6666-666666666666', 'Early Day', 'DAY', '05:00', '15:00', 10),
        ('77777777-7777-7777-7777-777777777777', 'Late Day', 'DAY', '09:00', '19:00', 10),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Night', 'NIGHT', '21:00', '07:00', 10);
END $$;

-- Test Employee Policies

-- Test as Manager
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "' || tests.get_supabase_uid('test.manager@example.com') || '", "email": "test.manager@example.com", "role": "authenticated"}';

SELECT ok(
    EXISTS(SELECT 1 FROM public.employees),
    'Manager can view all employees'
);

SELECT ok(
    EXISTS(
        INSERT INTO public.employees (auth_id, first_name, last_name, email, role, shift_pattern)
        VALUES (tests.create_supabase_user('new.employee@example.com'), 'New', 'Employee', 'new.employee@example.com', 'dispatcher', '4x10')
        RETURNING true
    ),
    'Manager can create employees'
);

-- Test as Supervisor
SET request.jwt.claims TO '{"sub": "' || tests.get_supabase_uid('test.supervisor@example.com') || '", "email": "test.supervisor@example.com", "role": "authenticated"}';

SELECT ok(
    (SELECT count(*) FROM public.employees) = 2,
    'Supervisor can only view team members'
);

SELECT ok(
    NOT EXISTS(
        INSERT INTO public.employees (auth_id, first_name, last_name, email, role, shift_pattern)
        VALUES (tests.create_supabase_user('another.employee@example.com'), 'New', 'Employee', 'another.employee@example.com', 'dispatcher', '4x10')
        RETURNING true
    ),
    'Supervisor cannot create employees'
);

-- Test as Dispatcher
SET request.jwt.claims TO '{"sub": "' || tests.get_supabase_uid('test.dispatcher@example.com') || '", "email": "test.dispatcher@example.com", "role": "authenticated"}';

SELECT ok(
    (SELECT count(*) FROM public.employees) = 1,
    'Dispatcher can only view own record'
);

-- Test Schedule Policies

-- Create test schedules
INSERT INTO public.assigned_shifts (id, employee_id, shift_id, date)
VALUES 
    ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', CURRENT_DATE),
    ('88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777777', CURRENT_DATE);

-- Test as Manager
SET request.jwt.claims TO '{"sub": "' || tests.get_supabase_uid('test.manager@example.com') || '", "email": "test.manager@example.com", "role": "authenticated"}';

SELECT ok(
    (SELECT count(*) FROM public.assigned_shifts) = 2,
    'Manager can view all schedules'
);

-- Test as Supervisor
SET request.jwt.claims TO '{"sub": "' || tests.get_supabase_uid('test.supervisor@example.com') || '", "email": "test.supervisor@example.com", "role": "authenticated"}';

SELECT ok(
    (SELECT count(*) FROM public.assigned_shifts) = 1,
    'Supervisor can only view team schedules'
);

-- Test as Dispatcher
SET request.jwt.claims TO '{"sub": "' || tests.get_supabase_uid('test.dispatcher@example.com') || '", "email": "test.dispatcher@example.com", "role": "authenticated"}';

SELECT ok(
    (SELECT count(*) FROM public.assigned_shifts) = 1,
    'Dispatcher can only view own schedules'
);

-- Test Time Off Request Policies

-- Create test time off requests
INSERT INTO public.time_off_requests (id, employee_id, start_date, end_date, status, notes)
VALUES 
    ('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', CURRENT_DATE, CURRENT_DATE + 1, 'pending', 'Test request'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', CURRENT_DATE, CURRENT_DATE + 1, 'pending', 'Test request 2');

-- Test as Manager
SET request.jwt.claims TO '{"sub": "' || tests.get_supabase_uid('test.manager@example.com') || '", "email": "test.manager@example.com", "role": "authenticated"}';

SELECT ok(
    (SELECT count(*) FROM public.time_off_requests) = 2,
    'Manager can view all time off requests'
);

SELECT ok(
    EXISTS(
        UPDATE public.time_off_requests 
        SET status = 'approved' 
        WHERE id = '99999999-9999-9999-9999-999999999999'
        RETURNING true
    ),
    'Manager can approve time off requests'
);

-- Test as Supervisor
SET request.jwt.claims TO '{"sub": "' || tests.get_supabase_uid('test.supervisor@example.com') || '", "email": "test.supervisor@example.com", "role": "authenticated"}';

SELECT ok(
    (SELECT count(*) FROM public.time_off_requests) = 1,
    'Supervisor can only view team time off requests'
);

SELECT ok(
    EXISTS(
        UPDATE public.time_off_requests 
        SET status = 'approved' 
        WHERE id = '99999999-9999-9999-9999-999999999999'
        RETURNING true
    ),
    'Supervisor can approve team time off requests'
);

-- Test as Dispatcher
SET request.jwt.claims TO '{"sub": "' || tests.get_supabase_uid('test.dispatcher@example.com') || '", "email": "test.dispatcher@example.com", "role": "authenticated"}';

SELECT ok(
    (SELECT count(*) FROM public.time_off_requests) = 1,
    'Dispatcher can only view own time off requests'
);

SELECT ok(
    EXISTS(
        INSERT INTO public.time_off_requests (employee_id, start_date, end_date, notes)
        VALUES ('33333333-3333-3333-3333-333333333333', CURRENT_DATE + 7, CURRENT_DATE + 8, 'New request')
        RETURNING true
    ),
    'Dispatcher can create own time off requests'
);

SELECT ok(
    NOT EXISTS(
        UPDATE public.time_off_requests 
        SET status = 'approved' 
        WHERE id = '99999999-9999-9999-9999-999999999999'
        RETURNING true
    ),
    'Dispatcher cannot approve time off requests'
);

-- Clean up test data
SELECT tests.cleanup_test_data();

-- Finish the tests
SELECT * FROM finish();
ROLLBACK; 