-- Clean up any existing test data first
SELECT tests.cleanup_test_data();

-- Begin transaction and plan the tests
BEGIN;
SELECT plan(50);

-- Create test teams first (to satisfy foreign key constraints)
INSERT INTO public.teams (id, name, description)
VALUES 
    ('99999999-9999-9999-9999-999999999999'::uuid, 'Team A', 'Test Team A'),
    ('88888888-8888-8888-8888-888888888888'::uuid, 'Team B', 'Test Team B');

-- Create test users and store their IDs using the helper function
DO $$
DECLARE
    manager_id uuid;
    supervisor_id uuid;
    dispatcher_id uuid;
    other_dispatcher_id uuid;
BEGIN
    -- Create users and store their IDs
    manager_id := tests.create_supabase_user('test.manager@example.com');
    supervisor_id := tests.create_supabase_user('test.supervisor@example.com');
    dispatcher_id := tests.create_supabase_user('test.dispatcher@example.com');
    other_dispatcher_id := tests.create_supabase_user('test.other.dispatcher@example.com');

    -- Update employee records
    UPDATE public.employees 
    SET role = 'manager',
        first_name = 'Test',
        last_name = 'Manager'
    WHERE auth_id = manager_id;

    UPDATE public.employees 
    SET role = 'supervisor',
        first_name = 'Test',
        last_name = 'Supervisor'
    WHERE auth_id = supervisor_id;

    UPDATE public.employees 
    SET role = 'dispatcher',
        first_name = 'Test',
        last_name = 'Dispatcher'
    WHERE auth_id = dispatcher_id;

    UPDATE public.employees 
    SET role = 'dispatcher',
        first_name = 'Other',
        last_name = 'Dispatcher'
    WHERE auth_id = other_dispatcher_id;

    -- Store test variables
    PERFORM set_config('test.manager_id', manager_id::text, true);
    PERFORM set_config('test.supervisor_id', supervisor_id::text, true);
    PERFORM set_config('test.dispatcher_id', dispatcher_id::text, true);
    PERFORM set_config('test.other_dispatcher_id', other_dispatcher_id::text, true);
END $$;

-- Create test shift options
INSERT INTO public.shift_options (id, name, category, start_time, end_time, duration_hours)
VALUES 
    ('66666666-6666-6666-6666-666666666666'::uuid, 'Early Day', 'day', '05:00', '15:00', 10),
    ('77777777-7777-7777-7777-777777777777'::uuid, 'Late Day', 'day', '09:00', '19:00', 10),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Night', 'graveyard', '21:00', '07:00', 10);

-- Create test schedules
INSERT INTO public.assigned_shifts (id, employee_id, shift_id, date)
SELECT 
    '55555555-5555-5555-5555-555555555555'::uuid,
    e.id,
    '66666666-6666-6666-6666-666666666666'::uuid,
    CURRENT_DATE
FROM public.employees e
WHERE e.auth_id = (current_setting('test.dispatcher_id')::uuid)
UNION ALL
SELECT 
    '88888888-8888-8888-8888-888888888888'::uuid,
    e.id,
    '77777777-7777-7777-7777-777777777777'::uuid,
    CURRENT_DATE
FROM public.employees e
WHERE e.auth_id = (current_setting('test.other_dispatcher_id')::uuid);

-- Create test time off requests
INSERT INTO public.time_off_requests (id, employee_id, start_date, end_date, reason, type, status)
SELECT 
    '99999999-9999-9999-9999-999999999999'::uuid,
    e.id,
    CURRENT_DATE,
    CURRENT_DATE + 1,
    'Sick',
    'PTO',
    'pending'
FROM public.employees e
WHERE e.auth_id = (current_setting('test.dispatcher_id')::uuid)
UNION ALL
SELECT 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    e.id,
    CURRENT_DATE,
    CURRENT_DATE + 1,
    'Vacation',
    'PTO',
    'pending'
FROM public.employees e
WHERE e.auth_id = (current_setting('test.other_dispatcher_id')::uuid);

-- Test Employee Policies

-- Test as Manager
SELECT set_config('request.jwt.claims', format('{"sub": "%s", "email": "test.manager@example.com", "role": "authenticated"}', tests.get_supabase_uid('test.manager@example.com')), true);
SELECT ok(
    EXISTS(SELECT 1 FROM public.employees),
    'Manager can view all employees'
);

-- Test as Supervisor
SELECT set_config('request.jwt.claims', format('{"sub": "%s", "email": "test.supervisor@example.com", "role": "authenticated"}', tests.get_supabase_uid('test.supervisor@example.com')), true);

SELECT ok(
    (SELECT count(*) FROM public.employees) = 2,
    'Supervisor can only view team members'
);

-- Test as Dispatcher
SELECT set_config('request.jwt.claims', format('{"sub": "%s", "email": "test.dispatcher@example.com", "role": "authenticated"}', tests.get_supabase_uid('test.dispatcher@example.com')), true);

SELECT ok(
    (SELECT count(*) FROM public.employees) = 1,
    'Dispatcher can only view own record'
);

-- Test Schedule Policies

-- Reset to Manager
SELECT set_config('request.jwt.claims', format('{"sub": "%s", "email": "test.manager@example.com", "role": "authenticated"}', tests.get_supabase_uid('test.manager@example.com')), true);

SELECT ok(
    (SELECT count(*) FROM public.assigned_shifts) = 2,
    'Manager can view all schedules'
);

-- Test as Supervisor
SELECT set_config('request.jwt.claims', format('{"sub": "%s", "email": "test.supervisor@example.com", "role": "authenticated"}', tests.get_supabase_uid('test.supervisor@example.com')), true);

SELECT ok(
    (SELECT count(*) FROM public.assigned_shifts) = 1,
    'Supervisor can only view team schedules'
);

-- Test as Dispatcher
SELECT set_config('request.jwt.claims', format('{"sub": "%s", "email": "test.dispatcher@example.com", "role": "authenticated"}', tests.get_supabase_uid('test.dispatcher@example.com')), true);

SELECT ok(
    (SELECT count(*) FROM public.assigned_shifts) = 1,
    'Dispatcher can only view own schedules'
);

-- Test Time Off Request Policies

-- Reset to Manager
SELECT set_config('request.jwt.claims', format('{"sub": "%s", "email": "test.manager@example.com", "role": "authenticated"}', tests.get_supabase_uid('test.manager@example.com')), true);

SELECT ok(
    (SELECT count(*) FROM public.time_off_requests) = 2,
    'Manager can view all time off requests'
);

-- Test as Supervisor
SELECT set_config('request.jwt.claims', format('{"sub": "%s", "email": "test.supervisor@example.com", "role": "authenticated"}', tests.get_supabase_uid('test.supervisor@example.com')), true);

SELECT ok(
    (SELECT count(*) FROM public.time_off_requests) = 1,
    'Supervisor can only view team time off requests'
);

-- Test as Dispatcher
SELECT set_config('request.jwt.claims', format('{"sub": "%s", "email": "test.dispatcher@example.com", "role": "authenticated"}', tests.get_supabase_uid('test.dispatcher@example.com')), true);

SELECT ok(
    (SELECT count(*) FROM public.time_off_requests) = 1,
    'Dispatcher can only view own time off requests'
);

-- Test individual_shifts RLS policies
-- Manager can read all shifts
SELECT results_eq(
    $$
    SET ROLE authenticated;
    SET request.jwt.claim.sub = current_setting('test.manager_id');
    SELECT COUNT(*) FROM public.individual_shifts;
    $$,
    $$VALUES(0::bigint)$$,
    'Manager can read all shifts'
);

-- Supervisor can read all shifts
SELECT results_eq(
    $$
    SET ROLE authenticated;
    SET request.jwt.claim.sub = current_setting('test.supervisor_id');
    SELECT COUNT(*) FROM public.individual_shifts;
    $$,
    $$VALUES(0::bigint)$$,
    'Supervisor can read all shifts'
);

-- Dispatcher can only read their own shifts
SELECT results_eq(
    $$
    SET ROLE authenticated;
    SET request.jwt.claim.sub = current_setting('test.dispatcher_id');
    SELECT COUNT(*) FROM public.individual_shifts
    WHERE employee_id = (SELECT id FROM public.employees WHERE auth_id = current_setting('test.dispatcher_id')::uuid);
    $$,
    $$VALUES(0::bigint)$$,
    'Dispatcher can only read their own shifts'
);

-- Test shift_options RLS policies
-- All authenticated users can read shift options
SELECT results_eq(
    $$
    SET ROLE authenticated;
    SET request.jwt.claim.sub = current_setting('test.dispatcher_id');
    SELECT COUNT(*) FROM public.shift_options;
    $$,
    $$VALUES(0::bigint)$$,
    'All authenticated users can read shift options'
);

-- Only managers can create shift options
SELECT throws_ok(
    $$
    SET ROLE authenticated;
    SET request.jwt.claim.sub = current_setting('test.dispatcher_id');
    INSERT INTO public.shift_options (name, category, start_time, end_time, duration_hours)
    VALUES ('Test Shift', 'day', '09:00', '17:00', 8);
    $$,
    'new row violates row-level security policy',
    'Non-managers cannot create shift options'
);

-- Test staffing_requirements RLS policies
-- Managers and supervisors can read staffing requirements
SELECT results_eq(
    $$
    SET ROLE authenticated;
    SET request.jwt.claim.sub = current_setting('test.supervisor_id');
    SELECT COUNT(*) FROM public.staffing_requirements;
    $$,
    $$VALUES(0::bigint)$$,
    'Supervisors can read staffing requirements'
);

-- Dispatchers cannot read staffing requirements
SELECT throws_ok(
    $$
    SET ROLE authenticated;
    SET request.jwt.claim.sub = current_setting('test.dispatcher_id');
    SELECT * FROM public.staffing_requirements;
    $$,
    'new row violates row-level security policy',
    'Dispatchers cannot read staffing requirements'
);

-- Test time_off_requests RLS policies
-- Managers can read all time off requests
SELECT results_eq(
    $$
    SET ROLE authenticated;
    SET request.jwt.claim.sub = current_setting('test.manager_id');
    SELECT COUNT(*) FROM public.time_off_requests;
    $$,
    $$VALUES(0::bigint)$$,
    'Managers can read all time off requests'
);

-- Dispatchers can only read their own time off requests
SELECT results_eq(
    $$
    SET ROLE authenticated;
    SET request.jwt.claim.sub = current_setting('test.dispatcher_id');
    SELECT COUNT(*) FROM public.time_off_requests
    WHERE employee_id = (SELECT id FROM public.employees WHERE auth_id = current_setting('test.dispatcher_id')::uuid);
    $$,
    $$VALUES(0::bigint)$$,
    'Dispatchers can only read their own time off requests'
);

-- Finish the tests
SELECT * FROM finish();
ROLLBACK; 