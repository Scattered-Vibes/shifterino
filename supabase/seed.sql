-- Clean up any existing test data
SELECT tests.cleanup_test_data();

-- Create test users (trigger will create corresponding employee records)
SELECT tests.create_supabase_user(
    'test.manager@example.com',
    'Test',
    'Manager',
    'manager',
    '4x10',
    'Manager@123'
);

SELECT tests.create_supabase_user(
    'test.supervisor@example.com',
    'Test',
    'Supervisor',
    'supervisor',
    '4x10',
    'Supervisor@123'
);

SELECT tests.create_supabase_user(
    'test.dispatcher1@example.com',
    'Test',
    'Dispatcher1',
    'dispatcher',
    '3x12_plus_4',
    'Dispatcher@123'
);

SELECT tests.create_supabase_user(
    'test.dispatcher2@example.com',
    'Test',
    'Dispatcher2',
    'dispatcher',
    '4x10',
    'Dispatcher@123'
);

-- Populate initial shift templates
INSERT INTO public.shifts (name, start_time, end_time, duration_hours, is_overnight)
VALUES
    ('Early 10hr', '05:00', '15:00', 10.00, false),
    ('Day 10hr', '09:00', '19:00', 10.00, false),
    ('Swing 10hr', '15:00', '01:00', 10.00, true),
    ('Night 10hr', '21:00', '07:00', 10.00, true),
    ('Early 12hr', '05:00', '17:00', 12.00, false),
    ('Day 12hr', '09:00', '21:00', 12.00, false),
    ('Swing 12hr', '15:00', '03:00', 12.00, true),
    ('Night 12hr', '21:00', '09:00', 12.00, true),
    ('Early 4hr', '05:00', '09:00', 4.00, false),
    ('Day 4hr', '09:00', '13:00', 4.00, false),
    ('Afternoon 4hr', '13:00', '17:00', 4.00, false),
    ('Evening 4hr', '17:00', '21:00', 4.00, false);

-- Populate staffing requirements
INSERT INTO public.staffing_requirements (start_time, end_time, min_total_staff, min_supervisors)
VALUES
    ('05:00', '09:00', 6, 1),  -- Early morning
    ('09:00', '21:00', 8, 1),  -- Day shift
    ('21:00', '01:00', 7, 1),  -- Evening
    ('01:00', '05:00', 6, 1);  -- Night shift

-- Create an example schedule period
INSERT INTO public.schedule_periods (
    start_date,
    end_date,
    status,
    description
)
VALUES (
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '4 months',
    'draft',
    'Current Schedule Period'
);

-- Create some example assigned shifts
WITH employee_shifts AS (
    SELECT 
        e.id as employee_id,
        e.shift_pattern,
        e.role,
        s.id as shift_id,
        s.name as shift_name,
        s.duration_hours,
        s.start_time,
        s.end_time,
        d.day_offset
    FROM public.employees e
    CROSS JOIN (
        SELECT * FROM public.shifts
        WHERE (name LIKE '%10hr' AND duration_hours = 10)
           OR (name LIKE '%12hr' AND duration_hours = 12)
           OR (name LIKE '%4hr' AND duration_hours = 4)
    ) s
    CROSS JOIN (
        SELECT generate_series(0, 3) as day_offset
    ) d
    WHERE e.email LIKE 'test.%@example.com'
)
INSERT INTO public.assigned_shifts (
    employee_id,
    shift_id,
    date
)
SELECT 
    employee_id,
    shift_id,
    CURRENT_DATE + (day_offset || ' days')::interval as date
FROM (
    SELECT 
        es.*,
        ROW_NUMBER() OVER (PARTITION BY employee_id, day_offset ORDER BY 
            CASE 
                WHEN es.shift_pattern = '4x10' AND es.duration_hours = 10 THEN 1
                WHEN es.shift_pattern = '3x12_plus_4' AND day_offset < 3 AND es.duration_hours = 12 THEN 1
                WHEN es.shift_pattern = '3x12_plus_4' AND day_offset = 3 AND es.duration_hours = 4 THEN 1
                ELSE 2
            END
        ) as rn
    FROM employee_shifts es
) ranked
WHERE rn = 1
  AND (
    (shift_pattern = '4x10' AND duration_hours = 10)
    OR 
    (shift_pattern = '3x12_plus_4' AND (
        (day_offset < 3 AND duration_hours = 12)
        OR 
        (day_offset = 3 AND duration_hours = 4)
    ))
  )
  AND (
    (role = 'supervisor' AND shift_name LIKE 'Day%')
    OR 
    (role = 'dispatcher' AND shift_name LIKE 'Early%')
  );

-- Create some example time-off requests
INSERT INTO public.time_off_requests (
    employee_id,
    start_date,
    end_date,
    status,
    notes
)
SELECT 
    e.id as employee_id,
    CURRENT_DATE + INTERVAL '2 weeks' as start_date,
    CURRENT_DATE + INTERVAL '2 weeks' + INTERVAL '3 days' as end_date,
    'pending'::public.time_off_status as status,
    'Vacation request' as notes
FROM public.employees e
WHERE e.email = 'test.dispatcher1@example.com'
UNION ALL
SELECT 
    e.id as employee_id,
    CURRENT_DATE + INTERVAL '3 weeks' as start_date,
    CURRENT_DATE + INTERVAL '3 weeks' + INTERVAL '1 day' as end_date,
    'approved'::public.time_off_status as status,
    'Doctor appointment' as notes
FROM public.employees e
WHERE e.email = 'test.supervisor@example.com'; 