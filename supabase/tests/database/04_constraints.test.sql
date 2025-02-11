-- Begin transaction and plan the tests
BEGIN;
SELECT plan(20);

-- Create test data
INSERT INTO public.shift_options (id, name, category, start_time, end_time, duration_hours)
VALUES 
    ('test-shift-1', 'Early Day', 'early', '05:00', '15:00', 10),
    ('test-shift-2', 'Late Day', 'day', '09:00', '19:00', 10),
    ('test-shift-3', 'Night', 'graveyard', '22:00', '08:00', 10),
    ('test-shift-4', 'Short', 'day', '09:00', '13:00', 4),
    ('test-shift-5', 'Long', 'day', '07:00', '19:00', 12);

-- Test shift option constraints
SELECT throws_ok(
    $$
    INSERT INTO public.shift_options (name, category, start_time, end_time, duration_hours)
    VALUES ('Early Day', 'early', '06:00', '16:00', 10)
    $$,
    'unique_shift_option_name_per_category',
    'Cannot create shift option with duplicate name in same category'
);

SELECT throws_ok(
    $$
    INSERT INTO public.shift_options (name, category, start_time, end_time, duration_hours)
    VALUES ('Invalid Duration', 'day', '09:00', '16:00', 10)
    $$,
    'valid_shift_duration',
    'Duration must match start and end times'
);

-- Test overlapping shifts
INSERT INTO public.schedules (employee_id, shift_option_id, schedule_period_id, date, status)
VALUES ('test-employee-1', 'test-shift-1', 'test-period-1', CURRENT_DATE, 'scheduled');

SELECT throws_ok(
    $$
    INSERT INTO public.schedules (employee_id, shift_option_id, schedule_period_id, date, status)
    VALUES ('test-employee-1', 'test-shift-2', 'test-period-1', CURRENT_DATE, 'scheduled')
    $$,
    'no_overlapping_shifts_range',
    'Cannot create overlapping shifts for same employee'
);

-- Test overlapping time off requests
INSERT INTO public.time_off_requests (employee_id, start_date, end_date, status, reason)
VALUES ('test-employee-1', CURRENT_DATE, CURRENT_DATE + 2, 'pending', 'Test request');

SELECT throws_ok(
    $$
    INSERT INTO public.time_off_requests (employee_id, start_date, end_date, status, reason)
    VALUES ('test-employee-1', CURRENT_DATE + 1, CURRENT_DATE + 3, 'pending', 'Test request 2')
    $$,
    'no_overlapping_time_off',
    'Cannot create overlapping time off requests'
);

-- Test weekly hours cap
UPDATE public.employees 
SET weekly_hours_cap = 40 
WHERE id = 'test-employee-1';

-- Add shifts up to 35 hours
INSERT INTO public.schedules (employee_id, shift_option_id, schedule_period_id, date, status)
VALUES 
    ('test-employee-1', 'test-shift-5', 'test-period-1', CURRENT_DATE + 1, 'scheduled'),
    ('test-employee-1', 'test-shift-5', 'test-period-1', CURRENT_DATE + 2, 'scheduled'),
    ('test-employee-1', 'test-shift-5', 'test-period-1', CURRENT_DATE + 3, 'scheduled');

-- Try to add another shift that would exceed cap
SELECT throws_ok(
    $$
    INSERT INTO public.schedules (employee_id, shift_option_id, schedule_period_id, date, status)
    VALUES ('test-employee-1', 'test-shift-2', 'test-period-1', CURRENT_DATE + 4, 'scheduled')
    $$,
    'Weekly hours (46) would exceed cap (40) for employee'
);

-- Test pattern A constraints
UPDATE public.employees 
SET shift_pattern = 'pattern_a' 
WHERE id = 'test-employee-1';

-- Add 4 consecutive 10-hour shifts
INSERT INTO public.schedules (employee_id, shift_option_id, schedule_period_id, date, status)
VALUES 
    ('test-employee-1', 'test-shift-1', 'test-period-1', CURRENT_DATE + 7, 'scheduled'),
    ('test-employee-1', 'test-shift-1', 'test-period-1', CURRENT_DATE + 8, 'scheduled'),
    ('test-employee-1', 'test-shift-1', 'test-period-1', CURRENT_DATE + 9, 'scheduled'),
    ('test-employee-1', 'test-shift-1', 'test-period-1', CURRENT_DATE + 10, 'scheduled');

-- Try to add a fifth consecutive shift
SELECT throws_ok(
    $$
    INSERT INTO public.schedules (employee_id, shift_option_id, schedule_period_id, date, status)
    VALUES ('test-employee-1', 'test-shift-1', 'test-period-1', CURRENT_DATE + 11, 'scheduled')
    $$,
    'Pattern A allows maximum 4 consecutive shifts'
);

-- Test pattern B constraints
UPDATE public.employees 
SET shift_pattern = 'pattern_b' 
WHERE id = 'test-employee-1';

-- Add 3 12-hour shifts
INSERT INTO public.schedules (employee_id, shift_option_id, schedule_period_id, date, status)
VALUES 
    ('test-employee-1', 'test-shift-5', 'test-period-1', CURRENT_DATE + 14, 'scheduled'),
    ('test-employee-1', 'test-shift-5', 'test-period-1', CURRENT_DATE + 15, 'scheduled'),
    ('test-employee-1', 'test-shift-5', 'test-period-1', CURRENT_DATE + 16, 'scheduled');

-- Add 1 4-hour shift
INSERT INTO public.schedules (employee_id, shift_option_id, schedule_period_id, date, status)
VALUES ('test-employee-1', 'test-shift-4', 'test-period-1', CURRENT_DATE + 17, 'scheduled');

-- Try to add another 12-hour shift
SELECT throws_ok(
    $$
    INSERT INTO public.schedules (employee_id, shift_option_id, schedule_period_id, date, status)
    VALUES ('test-employee-1', 'test-shift-5', 'test-period-1', CURRENT_DATE + 18, 'scheduled')
    $$,
    'Pattern B allows maximum 3 12-hour shifts and 1 4-hour shift'
);

-- Test NOT NULL constraints
SELECT col_is_null('schedules', 'actual_start_time', 'actual_start_time can be null');
SELECT col_not_null('schedules', 'employee_id', 'employee_id cannot be null');
SELECT col_not_null('schedules', 'shift_option_id', 'shift_option_id cannot be null');
SELECT col_not_null('schedules', 'date', 'date cannot be null');
SELECT col_not_null('schedules', 'status', 'status cannot be null');

SELECT col_not_null('time_off_requests', 'employee_id', 'employee_id cannot be null');
SELECT col_not_null('time_off_requests', 'start_date', 'start_date cannot be null');
SELECT col_not_null('time_off_requests', 'end_date', 'end_date cannot be null');
SELECT col_not_null('time_off_requests', 'status', 'status cannot be null');

SELECT col_not_null('shift_options', 'name', 'name cannot be null');
SELECT col_not_null('shift_options', 'category', 'category cannot be null');
SELECT col_not_null('shift_options', 'start_time', 'start_time cannot be null');
SELECT col_not_null('shift_options', 'end_time', 'end_time cannot be null');
SELECT col_not_null('shift_options', 'duration_hours', 'duration_hours cannot be null');

-- Finish the tests
SELECT * FROM finish();
ROLLBACK; 