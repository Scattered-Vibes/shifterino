-- Begin transaction and plan the tests
BEGIN;
SELECT plan(50);

-- Create test users
SELECT tests.create_supabase_user('test.manager@example.com');
SELECT tests.create_supabase_user('test.supervisor@example.com');
SELECT tests.create_supabase_user('test.dispatcher@example.com');
SELECT tests.create_supabase_user('test.dispatcher2@example.com');

-- Create test employees
INSERT INTO public.employees (id, auth_id, first_name, last_name, email, role, shift_pattern, team_id)
VALUES 
    ('11111111-1111-1111-1111-111111111111', tests.get_supabase_uid('test.manager@example.com'), 'Test', 'Manager', 'test.manager@example.com', 'manager', 'pattern_a', null),
    ('22222222-2222-2222-2222-222222222222', tests.get_supabase_uid('test.supervisor@example.com'), 'Test', 'Supervisor', 'test.supervisor@example.com', 'supervisor', 'pattern_a', '99999999-9999-9999-9999-999999999999'),
    ('33333333-3333-3333-3333-333333333333', tests.get_supabase_uid('test.dispatcher@example.com'), 'Test', 'Dispatcher', 'test.dispatcher@example.com', 'dispatcher', 'pattern_b', '99999999-9999-9999-9999-999999999999'),
    ('44444444-4444-4444-4444-444444444444', tests.get_supabase_uid('test.dispatcher2@example.com'), 'Test', 'Dispatcher2', 'test.dispatcher2@example.com', 'dispatcher', 'pattern_a', '88888888-8888-8888-8888-888888888888');

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
        VALUES (gen_random_uuid(), 'New', 'Employee', 'new.employee@example.com', 'dispatcher', 'pattern_a')
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
        VALUES (gen_random_uuid(), 'New', 'Employee', 'another.employee@example.com', 'dispatcher', 'pattern_a')
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
INSERT INTO public.schedules (id, employee_id, shift_option_id, schedule_period_id, date, status)
VALUES 
    ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777', CURRENT_DATE, 'scheduled'),
    ('88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777', CURRENT_DATE, 'scheduled');

-- Test as Manager
SET request.jwt.claims TO '{"sub": "' || tests.get_supabase_uid('test.manager@example.com') || '", "email": "test.manager@example.com", "role": "authenticated"}';

SELECT ok(
    (SELECT count(*) FROM public.schedules) = 2,
    'Manager can view all schedules'
);

-- Test as Supervisor
SET request.jwt.claims TO '{"sub": "' || tests.get_supabase_uid('test.supervisor@example.com') || '", "email": "test.supervisor@example.com", "role": "authenticated"}';

SELECT ok(
    (SELECT count(*) FROM public.schedules) = 1,
    'Supervisor can only view team schedules'
);

-- Test as Dispatcher
SET request.jwt.claims TO '{"sub": "' || tests.get_supabase_uid('test.dispatcher@example.com') || '", "email": "test.dispatcher@example.com", "role": "authenticated"}';

SELECT ok(
    (SELECT count(*) FROM public.schedules) = 1,
    'Dispatcher can only view own schedules'
);

-- Test Time Off Request Policies

-- Create test time off requests
INSERT INTO public.time_off_requests (id, employee_id, start_date, end_date, status, reason)
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
        INSERT INTO public.time_off_requests (employee_id, start_date, end_date, reason)
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

-- Test Audit Logging
SET request.jwt.claims TO '{"sub": "' || tests.get_supabase_uid('test.manager@example.com') || '", "email": "test.manager@example.com", "role": "authenticated"}';

UPDATE public.employees 
SET role = 'supervisor' 
WHERE email = 'test.dispatcher@example.com';

SELECT ok(
    EXISTS(
        SELECT 1 
        FROM public.audit_logs 
        WHERE table_name = 'employees' 
        AND operation = 'UPDATE'
        AND record_id = '33333333-3333-3333-3333-333333333333'
    ),
    'Audit log created for employee role change'
);

-- Finish the tests
SELECT * FROM finish();
ROLLBACK; 