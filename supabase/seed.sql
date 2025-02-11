-- Seed file for the 911 Dispatch Scheduling System
-- Contains minimal test data for feature testing

-- Reset all relevant tables
TRUNCATE TABLE auth.users CASCADE;
TRUNCATE TABLE public.employees, public.schedules, public.time_off_requests, 
             public.shift_options, public.staffing_requirements, 
             public.shift_swap_requests, public.on_call_assignments CASCADE;

-- Temporarily disable the auth trigger
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- =====================
-- 1. Create Test Users
-- =====================

-- Manager (System Admin)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Manager
    '00000000-0000-0000-0000-000000000000'::uuid,
    'manager@dispatch911.test',
    crypt('test123', gen_salt('bf')),
    NOW(),
    jsonb_build_object(
        'role', 'manager',
        'first_name', 'Mike',
        'last_name', 'Manager'
    )
);

-- Supervisor
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data
) VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Supervisor
    '00000000-0000-0000-0000-000000000000'::uuid,
    'supervisor@dispatch911.test',
    crypt('test123', gen_salt('bf')),
    NOW(),
    jsonb_build_object(
        'role', 'supervisor',
        'first_name', 'Sarah',
        'last_name', 'Supervisor'
    )
);

-- Dispatchers (one for each shift pattern)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data
) VALUES
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- 4/10 Dispatcher
        '00000000-0000-0000-0000-000000000000'::uuid,
        'dispatcher1@dispatch911.test',
        crypt('test123', gen_salt('bf')),
        NOW(),
        jsonb_build_object(
            'role', 'dispatcher',
            'first_name', 'David',
            'last_name', 'Day'
        )
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- 3/12 Dispatcher
        '00000000-0000-0000-0000-000000000000'::uuid,
        'dispatcher2@dispatch911.test',
        crypt('test123', gen_salt('bf')),
        NOW(),
        jsonb_build_object(
            'role', 'dispatcher',
            'first_name', 'Nina',
            'last_name', 'Night'
        )
    );

-- Re-enable the auth trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- =====================
-- 2. Create Employees
-- =====================

INSERT INTO public.employees (
    id,
    auth_id,
    first_name,
    last_name,
    email,
    role,
    shift_pattern,
    preferred_shift_category,
    weekly_hours_cap,
    profile_completed
) VALUES
    (
        'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        'Mike',
        'Manager',
        'manager@dispatch911.test',
        'manager',
        '4_10',
        'DAY',
        40,
        true
    ),
    (
        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        'Sarah',
        'Supervisor',
        'supervisor@dispatch911.test',
        'supervisor',
        '4_10',
        'DAY',
        40,
        true
    ),
    (
        'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        'David',
        'Day',
        'dispatcher1@dispatch911.test',
        'dispatcher',
        '4_10',
        'DAY',
        40,
        true
    ),
    (
        'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        'Nina',
        'Night',
        'dispatcher2@dispatch911.test',
        'dispatcher',
        '3_12_4',
        'NIGHT',
        40,
        true
    );

-- =====================
-- 3. Create Shift Options
-- =====================

INSERT INTO public.shift_options (
    id,
    name,
    category,
    start_time,
    end_time,
    duration_hours
) VALUES
    -- Day Shifts
    (
        'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        'Early Day 10-Hour',
        'DAY',
        '05:00',
        '15:00',
        10
    ),
    (
        'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        'Day 12-Hour',
        'DAY',
        '09:00',
        '21:00',
        12
    ),
    (
        'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        'Day 4-Hour',
        'DAY',
        '09:00',
        '13:00',
        4
    ),
    -- Night Shifts
    (
        'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        'Night 12-Hour',
        'NIGHT',
        '21:00',
        '09:00',
        12
    ),
    (
        'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        'Night 4-Hour',
        'NIGHT',
        '01:00',
        '05:00',
        4
    );

-- =====================
-- 4. Create Schedule Period
-- =====================

INSERT INTO public.schedule_periods (
    id,
    start_date,
    end_date,
    description,
    is_published,
    published_at,
    published_by
) VALUES (
    'a3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    CURRENT_DATE,
    CURRENT_DATE + interval '30 days',
    'Current Schedule Period',
    true,
    NOW(),
    'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid  -- Published by manager
);

-- =====================
-- 5. Create Sample Schedules
-- =====================

INSERT INTO public.schedules (
    id,
    employee_id,
    shift_option_id,
    schedule_period_id,
    date,
    status
) VALUES
    -- Day shift for supervisor
    (
        'a4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Supervisor
        'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Early Day 10-Hour
        'a3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Current Period
        CURRENT_DATE,
        'scheduled'
    ),
    -- Day shift for day dispatcher
    (
        'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Day Dispatcher
        'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Early Day 10-Hour
        'a3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Current Period
        CURRENT_DATE,
        'scheduled'
    ),
    -- Night shift for night dispatcher
    (
        'c4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Night Dispatcher
        'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Night 12-Hour
        'a3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Current Period
        CURRENT_DATE,
        'scheduled'
    );

-- =====================
-- 6. Create Sample Time Off Request
-- =====================

INSERT INTO public.time_off_requests (
    id,
    employee_id,
    start_date,
    end_date,
    status,
    reason
) VALUES (
    'a5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Day Dispatcher
    CURRENT_DATE + interval '7 days',
    CURRENT_DATE + interval '8 days',
    'pending',
    'Personal appointment'
);

-- =====================
-- 7. Create Sample Shift Swap Request
-- =====================

INSERT INTO public.shift_swap_requests (
    id,
    requesting_employee_id,
    receiving_employee_id,
    requesting_shift_id,
    receiving_shift_id,
    status
) VALUES (
    'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Day Dispatcher
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Night Dispatcher
    'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Day shift
    'c4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Night shift
    'pending'
); 