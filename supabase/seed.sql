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
    id,
    start_date,
    end_date,
    status,
    description
)
VALUES (
    '44444444-4444-4444-4444-444444444444',
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
        s.id as shift_id,
        s.duration_hours,
        s.start_time,
        s.end_time,
        d.day_offset
    FROM public.employees e
    CROSS JOIN public.shifts s
    CROSS JOIN (
        SELECT generate_series(0, 3) as day_offset
    ) d
    WHERE e.role != 'manager'
        AND (
            (e.shift_pattern = '4_10' AND s.duration_hours = 10 AND s.name LIKE '%10hr')
            OR (e.shift_pattern = '3_12_4' AND 
                ((s.duration_hours = 12 AND s.name LIKE '%12hr' AND d.day_offset < 3) OR 
                 (s.duration_hours = 4 AND s.name LIKE '%4hr' AND d.day_offset = 3)))
        )
)
INSERT INTO public.assigned_shifts (
    employee_id,
    shift_id,
    date
)
SELECT DISTINCT ON (employee_id, date)
    employee_id,
    shift_id,
    CURRENT_DATE + (day_offset || ' days')::interval as date
FROM employee_shifts
WHERE (shift_pattern = '4_10' AND duration_hours = 10)
   OR (shift_pattern = '3_12_4' AND 
       ((duration_hours = 12 AND day_offset < 3) OR 
        (duration_hours = 4 AND day_offset = 3)))
ORDER BY employee_id, date, duration_hours DESC;

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
WHERE e.email = 'dispatcher1@dispatch911.com'
UNION ALL
SELECT 
    e.id as employee_id,
    CURRENT_DATE + INTERVAL '3 weeks' as start_date,
    CURRENT_DATE + INTERVAL '3 weeks' + INTERVAL '1 day' as end_date,
    'approved'::public.time_off_status as status,
    'Doctor appointment' as notes
FROM public.employees e
WHERE e.email = 'supervisor1@dispatch911.com'; 