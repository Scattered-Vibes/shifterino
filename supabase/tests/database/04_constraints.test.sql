-- Begin transaction and plan the tests
BEGIN;
SELECT plan(20);

-- Clean up any existing test data
SELECT tests.cleanup_test_data();

-- Create test data
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Create test user
    test_user_id := tests.create_supabase_user('test.employee@example.com');

    -- Create test team
    INSERT INTO public.teams (id, name, description)
    VALUES ('99999999-9999-9999-9999-999999999999', 'Team A', 'Test Team A');

    -- Create test employee
    INSERT INTO public.employees (id, auth_id, first_name, last_name, email, role, shift_pattern)
    VALUES ('11111111-1111-1111-1111-111111111111', test_user_id, 'Test', 'Employee', 'test@example.com', 'dispatcher', '4x10');

    -- Create test shifts
    INSERT INTO public.shifts (id, name, start_time, end_time, duration_hours)
    VALUES 
        ('22222222-2222-2222-2222-222222222222', 'Day Shift', '09:00', '17:00', 8),
        ('66666666-6666-6666-6666-666666666666', 'Early Day', 'DAY', '05:00', '15:00', 10);

    -- Create test assigned shift
    INSERT INTO public.assigned_shifts (employee_id, shift_id, date)
    VALUES ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', CURRENT_DATE);
END $$;

-- Test shift duration constraint
SELECT throws_ok(
    $$
    INSERT INTO public.shifts (name, start_time, end_time, duration_hours)
    VALUES ('Invalid Shift', '09:00', '22:00', 13)
    $$,
    'valid_duration',
    'Shift duration must be between 0 and 12 hours'
);

-- Test staffing requirements constraint
SELECT throws_ok(
    $$
    INSERT INTO public.staffing_requirements (start_time, end_time, min_total_staff, min_supervisors)
    VALUES ('09:00', '17:00', 5, 6)
    $$,
    'valid_staff_count',
    'Total staff must be greater than or equal to minimum supervisors'
);

-- Test time off request date range constraint
SELECT throws_ok(
    $$
    INSERT INTO public.time_off_requests (employee_id, start_date, end_date, status)
    VALUES ('11111111-1111-1111-1111-111111111111', CURRENT_DATE + 1, CURRENT_DATE, 'pending')
    $$,
    'valid_date_range',
    'End date must be after or equal to start date'
);

-- Test unique employee shift date constraint
SELECT throws_ok(
    $$
    INSERT INTO public.assigned_shifts (employee_id, shift_id, date)
    VALUES ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', CURRENT_DATE)
    $$,
    'unique_employee_shift_date',
    'Employee cannot be assigned multiple shifts on the same date'
);

-- Test shift overlap constraint
SELECT throws_ok(
    $$
    INSERT INTO public.assigned_shifts (employee_id, shift_id, date)
    VALUES ('11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', CURRENT_DATE)
    $$,
    'Shift overlaps with existing assignment'
);

-- Test employee role enum constraint
SELECT throws_ok(
    $$
    INSERT INTO public.employees (auth_id, first_name, last_name, email, role, shift_pattern)
    VALUES (tests.create_supabase_user('invalid.role@example.com'), 'Invalid', 'Role', 'invalid@example.com', 'invalid_role', '4x10')
    $$,
    'invalid input value for enum employee_role'
);

-- Test shift pattern enum constraint
SELECT throws_ok(
    $$
    INSERT INTO public.employees (auth_id, first_name, last_name, email, role, shift_pattern)
    VALUES (tests.create_supabase_user('invalid.pattern@example.com'), 'Invalid', 'Pattern', 'invalid@example.com', 'dispatcher', 'invalid_pattern')
    $$,
    'invalid input value for enum shift_pattern'
);

-- Test time off status enum constraint
SELECT throws_ok(
    $$
    INSERT INTO public.time_off_requests (employee_id, start_date, end_date, status)
    VALUES ('11111111-1111-1111-1111-111111111111', CURRENT_DATE, CURRENT_DATE + 1, 'invalid_status')
    $$,
    'invalid input value for enum time_off_status'
);

-- Clean up test data
SELECT tests.cleanup_test_data();

-- Finish the tests
SELECT * FROM finish();
ROLLBACK; 