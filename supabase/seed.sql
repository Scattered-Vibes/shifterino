-- supabase/seed.sql
-- Inserts initial data after migrations are applied.
-- This should only contain static data that is not user-specific.

-- Insert default shift options
INSERT INTO public.shift_options (id, name, category, start_time, end_time, duration_hours)
VALUES
    (uuid_generate_v4(), 'Early 4', 'early'::shift_category, '05:00', '09:00', 4),
    (uuid_generate_v4(), 'Early 10', 'early'::shift_category, '05:00', '15:00', 10),
    (uuid_generate_v4(), 'Early 12', 'early'::shift_category, '05:00', '17:00', 12),
    (uuid_generate_v4(), 'Day 4', 'day'::shift_category, '09:00', '13:00', 4),
    (uuid_generate_v4(), 'Day 10', 'day'::shift_category, '09:00', '19:00', 10),
    (uuid_generate_v4(), 'Day 12', 'day'::shift_category, '09:00', '21:00', 12),
    (uuid_generate_v4(), 'Swing 4', 'swing'::shift_category, '17:00', '21:00', 4),
    (uuid_generate_v4(), 'Swing 10', 'swing'::shift_category, '15:00', '01:00', 10),
    (uuid_generate_v4(), 'Swing 12', 'swing'::shift_category, '15:00', '03:00', 12),
    (uuid_generate_v4(), 'Night 4', 'graveyard'::shift_category, '21:00', '01:00', 4),
    (uuid_generate_v4(), 'Night 10', 'graveyard'::shift_category, '19:00', '05:00', 10),
    (uuid_generate_v4(), 'Night 12', 'graveyard'::shift_category, '17:00', '05:00', 12)
ON CONFLICT (name) DO NOTHING;

-- Create default team
INSERT INTO public.teams (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000001', '911 Dispatch', 'Main dispatch team')
ON CONFLICT (id) DO NOTHING;

-- Insert default staffing requirements
INSERT INTO public.staffing_requirements (id, team_id, start_time, end_time, min_employees, min_supervisors)
VALUES
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', '05:00', '09:00', 6, 1),
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', '09:00', '21:00', 8, 1),
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', '21:00', '01:00', 7, 1),
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', '01:00', '05:00', 6, 1)
ON CONFLICT (team_id, start_time, end_time) DO NOTHING; 