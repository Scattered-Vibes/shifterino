-- Populate initial shift templates
INSERT INTO public.shifts (name, start_time, end_time, duration_hours, is_overnight)
VALUES
    ('Early 10hr', '05:00', '15:00', 10.00, false),
    ('Day 10hr', '09:00', '19:00', 10.00, false),
    ('Swing 10hr', '15:00', '01:00', 10.00, true),
    ('Night 10hr', '19:00', '05:00', 10.00, true),
    ('Early 12hr', '05:00', '17:00', 12.00, false),
    ('Day 12hr', '09:00', '21:00', 12.00, false),
    ('Swing 12hr', '15:00', '03:00', 12.00, true),
    ('Night 12hr', '17:00', '05:00', 12.00, true),
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