-- Insert staffing requirements
INSERT INTO public.staffing_requirements (
  name,
  time_block_start,
  time_block_end,
  min_total_staff,
  min_supervisors
) VALUES
  ('Morning_requirement', '05:00', '09:00', 6, 1),
  ('Daytime_requirement', '09:00', '21:00', 8, 1),
  ('Evening_requirement', '21:00', '01:00', 7, 1),
  ('Night_requirement', '01:00', '05:00', 6, 1);

-- Insert shift options
INSERT INTO public.shift_options (
  name,
  start_time,
  end_time,
  duration_hours,
  category
) VALUES
  -- Early Shifts
  ('Early 4-Hour', '05:00', '09:00', 4, 'early'),
  ('Early 10-Hour', '05:00', '15:00', 10, 'early'),
  ('Early 12-Hour', '05:00', '17:00', 12, 'early'),
  -- Day Shifts
  ('Day 4-Hour', '09:00', '13:00', 4, 'day'),
  ('Day 10-Hour', '09:00', '19:00', 10, 'day'),
  ('Day 12-Hour', '09:00', '21:00', 12, 'day'),
  -- Swing Shifts
  ('Swing 4-Hour', '13:00', '17:00', 4, 'swing'),
  ('Swing 10-Hour', '15:00', '01:00', 10, 'swing'),
  ('Swing 12-Hour', '15:00', '03:00', 12, 'swing'),
  -- Graveyard Shifts
  ('Graveyard 4-Hour', '01:00', '05:00', 4, 'graveyard'),
  ('Graveyard 10-Hour', '19:00', '05:00', 10, 'graveyard'),
  ('Graveyard 12-Hour', '17:00', '05:00', 12, 'graveyard');

-- Insert shift pattern rules
INSERT INTO public.shift_pattern_rules (
  pattern,
  consecutive_shifts,
  shift_durations,
  min_rest_hours
) VALUES
  ('pattern_a', 4, ARRAY[10, 10, 10, 10], 10),  -- Pattern A: Four consecutive 10-hour shifts
  ('pattern_b', 4, ARRAY[12, 12, 12, 4], 10);   -- Pattern B: Three consecutive 12-hour shifts plus one 4-hour shift

-- Note: Employee records will be created by the trigger when users sign up through Supabase Auth 