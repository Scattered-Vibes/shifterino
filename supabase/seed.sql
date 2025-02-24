-- supabase/seed.sql
-- Inserts initial data after migrations are applied.
-- This should only contain static data that is not user-specific.

-- Insert default organization (must be first due to foreign key constraints)
INSERT INTO public.organizations (
  id,
  name,
  contact_info
)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '911 Dispatch Center',
  '{"address": "123 Emergency St", "phone": "555-0911", "email": "admin@911dispatch.com"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Create default team
INSERT INTO public.teams (id, name, description, organization_id)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '911 Dispatch',
  'Main dispatch team',
  '00000000-0000-0000-0000-000000000002'
)
ON CONFLICT (id) DO NOTHING;

-- Insert shift options
INSERT INTO public.shift_options (id, name, category, start_time, end_time, duration_hours, is_overnight)
VALUES
    (uuid_generate_v4(), 'Early 4', 'early', '05:00', '09:00', 4, false),
    (uuid_generate_v4(), 'Early 10', 'early', '05:00', '15:00', 10, false),
    (uuid_generate_v4(), 'Early 12', 'early', '05:00', '17:00', 12, false),
    (uuid_generate_v4(), 'Day 4', 'day', '09:00', '13:00', 4, false),
    (uuid_generate_v4(), 'Day 10', 'day', '09:00', '19:00', 10, false),
    (uuid_generate_v4(), 'Day 12', 'day', '09:00', '21:00', 12, false),
    (uuid_generate_v4(), 'Swing 4', 'swing', '17:00', '21:00', 4, false),
    (uuid_generate_v4(), 'Swing 10', 'swing', '15:00', '01:00', 10, true),
    (uuid_generate_v4(), 'Swing 12', 'swing', '15:00', '03:00', 12, true),
    (uuid_generate_v4(), 'Night 4', 'graveyard', '21:00', '01:00', 4, true),
    (uuid_generate_v4(), 'Night 10', 'graveyard', '19:00', '05:00', 10, true),
    (uuid_generate_v4(), 'Night 12', 'graveyard', '17:00', '05:00', 12, true)
ON CONFLICT (name) DO NOTHING;

-- Insert staffing requirements
INSERT INTO public.staffing_requirements (
    time_block_start,
    time_block_end,
    min_employees,
    requires_supervisor,
    crosses_midnight
)
VALUES
    ('05:00', '09:00', 6, true, false),  -- Morning block
    ('09:00', '21:00', 8, true, false),  -- Day block
    ('21:00', '01:00', 7, true, true),   -- Evening block (crosses midnight)
    ('01:00', '05:00', 6, true, false)   -- Night block
ON CONFLICT DO NOTHING; 