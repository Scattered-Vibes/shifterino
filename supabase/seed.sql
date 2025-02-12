-- Seed file for the 911 Dispatch Scheduling System
-- Contains minimal test data for feature testing

-- =====================
-- IMPORTANT: User Creation
-- =====================
-- DO NOT directly manipulate auth.users or auth.identities tables.
-- Instead, use the provided script to create test users:
--   npm run create-test-users
--
-- This will:
-- 1. Create users through Supabase Auth API
-- 2. Create corresponding employee records
-- 3. Handle email confirmation
-- 4. Set up proper user metadata
--
-- Test users that will be created:
-- 1. manager@dispatch911.test (Manager)
-- 2. AdambPeterson@gmail.com (Manager)
-- 3. supervisor@dispatch911.test (Supervisor)
-- 4. dispatcher1@dispatch911.test (Dispatcher)
-- 5. dispatcher2@dispatch911.test (Dispatcher)

-- Reset non-auth tables
TRUNCATE TABLE public.schedules, public.time_off_requests, 
             public.shift_options, public.staffing_requirements, 
             public.shift_swap_requests, public.on_call_assignments CASCADE;

-- Note: We don't truncate employees table as it's managed by the create-test-users script

-- =====================
-- 1. Create Shift Options
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
-- 2. Create Schedule Period
-- =====================

-- Note: This assumes the manager user has been created via create-test-users script
-- If not, this insert might fail and need to be run after user creation
DO $$
DECLARE
    manager_id uuid;
BEGIN
    -- Get the manager's employee ID
    SELECT id INTO manager_id
    FROM public.employees
    WHERE email = 'manager@dispatch911.test'
    LIMIT 1;

    -- Create schedule period
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
        manager_id
    );
END $$;

-- =====================
-- 3. Create Sample Schedules
-- =====================

-- Note: These inserts depend on employees being created via create-test-users script
DO $$
DECLARE
    supervisor_id uuid;
    dispatcher1_id uuid;
    dispatcher2_id uuid;
BEGIN
    -- Get employee IDs
    SELECT id INTO supervisor_id
    FROM public.employees
    WHERE email = 'supervisor@dispatch911.test'
    LIMIT 1;

    SELECT id INTO dispatcher1_id
    FROM public.employees
    WHERE email = 'dispatcher1@dispatch911.test'
    LIMIT 1;

    SELECT id INTO dispatcher2_id
    FROM public.employees
    WHERE email = 'dispatcher2@dispatch911.test'
    LIMIT 1;

    -- Create schedules
    INSERT INTO public.schedules (
        id,
        employee_id,
        shift_option_id,
        schedule_period_id,
        date,
        status
    ) VALUES
    (
        'a4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        supervisor_id,
        'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Early Day 10-Hour
        'a3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Current Period
        CURRENT_DATE,
        'scheduled'
    ),
    (
        'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        dispatcher1_id,
        'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Early Day 10-Hour
        'a3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Current Period
        CURRENT_DATE,
        'scheduled'
    ),
    (
        'c4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        dispatcher2_id,
        'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Night 12-Hour
        'a3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Current Period
        CURRENT_DATE,
        'scheduled'
    );

    -- Create sample time off request
    INSERT INTO public.time_off_requests (
        id,
        employee_id,
        start_date,
        end_date,
        status,
        reason
    ) VALUES (
        'a5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        dispatcher1_id,
        CURRENT_DATE + interval '7 days',
        CURRENT_DATE + interval '8 days',
        'pending',
        'Personal appointment'
    );

    -- Create sample shift swap request
    INSERT INTO public.shift_swap_requests (
        id,
        requesting_employee_id,
        receiving_employee_id,
        requesting_shift_id,
        receiving_shift_id,
        status
    ) VALUES (
        'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        dispatcher1_id,
        dispatcher2_id,
        'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Day shift
        'c4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Night shift
        'pending'
    );
END $$;