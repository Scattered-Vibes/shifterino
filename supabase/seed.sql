-- Seed file for testing the scheduling system
-- Reset sequences
TRUNCATE TABLE auth.users CASCADE;
TRUNCATE TABLE employees, profiles, shift_options, staffing_requirements, schedule_periods, individual_shifts, time_off_requests, shift_swap_requests CASCADE;

-- Insert initial admin user
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'admin@shifterino.com',
    crypt('admin123', gen_salt('bf')), -- This is just for testing, in production use proper password management
    NOW(),
    jsonb_build_object(
        'role', 'manager',
        'first_name', 'System',
        'last_name', 'Admin'
    )
);

-- Insert test users
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data
) VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'john.supervisor@test.com', crypt('test123', gen_salt('bf')), NOW(),
     jsonb_build_object('role', 'supervisor', 'first_name', 'John', 'last_name', 'Supervisor', 'created_by', '00000000-0000-0000-0000-000000000000'::uuid)),
    ('22222222-2222-2222-2222-222222222222'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'jane.supervisor@test.com', crypt('test123', gen_salt('bf')), NOW(),
     jsonb_build_object('role', 'supervisor', 'first_name', 'Jane', 'last_name', 'Supervisor', 'created_by', '00000000-0000-0000-0000-000000000000'::uuid)),
    ('33333333-3333-3333-3333-333333333333'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'bob.dispatcher@test.com', crypt('test123', gen_salt('bf')), NOW(),
     jsonb_build_object('role', 'dispatcher', 'first_name', 'Bob', 'last_name', 'Dispatcher', 'created_by', '11111111-1111-1111-1111-111111111111'::uuid)),
    ('44444444-4444-4444-4444-444444444444'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'alice.dispatcher@test.com', crypt('test123', gen_salt('bf')), NOW(),
     jsonb_build_object('role', 'dispatcher', 'first_name', 'Alice', 'last_name', 'Dispatcher', 'created_by', '11111111-1111-1111-1111-111111111111'::uuid)),
    ('55555555-5555-5555-5555-555555555555'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'charlie.dispatcher@test.com', crypt('test123', gen_salt('bf')), NOW(),
     jsonb_build_object('role', 'dispatcher', 'first_name', 'Charlie', 'last_name', 'Dispatcher', 'created_by', '22222222-2222-2222-2222-222222222222'::uuid)),
    ('66666666-6666-6666-6666-666666666666'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'diana.dispatcher@test.com', crypt('test123', gen_salt('bf')), NOW(),
     jsonb_build_object('role', 'dispatcher', 'first_name', 'Diana', 'last_name', 'Dispatcher', 'created_by', '22222222-2222-2222-2222-222222222222'::uuid)),
    ('77777777-7777-7777-7777-777777777777'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'eve.dispatcher@test.com', crypt('test123', gen_salt('bf')), NOW(),
     jsonb_build_object('role', 'dispatcher', 'first_name', 'Eve', 'last_name', 'Dispatcher', 'created_by', '11111111-1111-1111-1111-111111111111'::uuid)),
    ('88888888-8888-8888-8888-888888888888'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'frank.dispatcher@test.com', crypt('test123', gen_salt('bf')), NOW(),
     jsonb_build_object('role', 'dispatcher', 'first_name', 'Frank', 'last_name', 'Dispatcher', 'created_by', '22222222-2222-2222-2222-222222222222'::uuid));

-- Insert shift options
INSERT INTO shift_options (id, name, start_time, end_time, duration_hours, category)
VALUES
    ('a1111111-1111-1111-1111-111111111111'::uuid, 'Early 4hr', '05:00', '09:00', 4, 'early'),
    ('a2222222-2222-2222-2222-222222222222'::uuid, 'Day 10hr', '09:00', '19:00', 10, 'day'),
    ('a3333333-3333-3333-3333-333333333333'::uuid, 'Swing 12hr', '15:00', '03:00', 12, 'swing'),
    ('a4444444-4444-4444-4444-444444444444'::uuid, 'Night 10hr', '21:00', '07:00', 10, 'graveyard');

-- Insert staffing requirements
INSERT INTO staffing_requirements (id, name, time_block_start, time_block_end, min_total_staff, min_supervisors)
VALUES
    ('b1111111-1111-1111-1111-111111111111'::uuid, 'Early Block', '05:00', '09:00', 6, 1),
    ('b2222222-2222-2222-2222-222222222222'::uuid, 'Day Block', '09:00', '21:00', 8, 1),
    ('b3333333-3333-3333-3333-333333333333'::uuid, 'Evening Block', '21:00', '01:00', 7, 1),
    ('b4444444-4444-4444-4444-444444444444'::uuid, 'Night Block', '01:00', '05:00', 6, 1);

-- Insert schedule period
INSERT INTO schedule_periods (id, start_date, end_date, description, is_active)
VALUES
    ('c1111111-1111-1111-1111-111111111111'::uuid, CURRENT_DATE, CURRENT_DATE + INTERVAL '28 days', 'Current Period', true);

-- Insert some individual shifts
INSERT INTO individual_shifts (
    id, employee_id, shift_option_id, schedule_period_id, date, status
)
SELECT 
    'd1111111-1111-1111-1111-111111111111'::uuid,
    e.id,
    'a2222222-2222-2222-2222-222222222222'::uuid,
    'c1111111-1111-1111-1111-111111111111'::uuid,
    CURRENT_DATE,
    'scheduled'::shift_status
FROM employees e
WHERE e.email = 'john.supervisor@test.com'
UNION ALL
SELECT 
    'd2222222-2222-2222-2222-222222222222'::uuid,
    e.id,
    'a3333333-3333-3333-3333-333333333333'::uuid,
    'c1111111-1111-1111-1111-111111111111'::uuid,
    CURRENT_DATE,
    'scheduled'::shift_status
FROM employees e
WHERE e.email = 'jane.supervisor@test.com'
UNION ALL
SELECT 
    'd3333333-3333-3333-3333-333333333333'::uuid,
    e.id,
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'c1111111-1111-1111-1111-111111111111'::uuid,
    CURRENT_DATE,
    'scheduled'::shift_status
FROM employees e
WHERE e.email = 'bob.dispatcher@test.com';

-- Insert time off request
INSERT INTO time_off_requests (
    id, employee_id, start_date, end_date, status, notes
)
SELECT
    'e1111111-1111-1111-1111-111111111111'::uuid,
    e.id,
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '8 days',
    'pending'::time_off_status,
    'Family event'
FROM employees e
WHERE e.email = 'bob.dispatcher@test.com';

-- Insert shift swap request
INSERT INTO shift_swap_requests (
    id, requester_id, requested_employee_id, shift_id, status, notes
)
SELECT
    'f1111111-1111-1111-1111-111111111111'::uuid,
    e1.id,
    e2.id,
    s.id,
    'pending'::time_off_status,
    'Need to swap early shift'
FROM employees e1
CROSS JOIN employees e2
CROSS JOIN individual_shifts s
WHERE e1.email = 'bob.dispatcher@test.com'
AND e2.email = 'alice.dispatcher@test.com'
AND s.employee_id = e1.id; 