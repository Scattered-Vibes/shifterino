BEGIN;

-- Plan the number of tests
SELECT plan(53);

-- Test core tables existence
SELECT has_table('public'::name, 'employees'::name);
SELECT has_table('public'::name, 'profiles'::name);
SELECT has_table('public'::name, 'shift_options'::name);
SELECT has_table('public'::name, 'individual_shifts'::name);
SELECT has_table('public'::name, 'schedule_periods'::name);
SELECT has_table('public'::name, 'time_off_requests'::name);
SELECT has_table('public'::name, 'shift_swap_requests'::name);
SELECT has_table('public'::name, 'scheduling_logs'::name);
SELECT has_table('public'::name, 'shift_assignment_scores'::name);

-- Test employees table structure
SELECT has_column('public'::name, 'employees'::name, 'id'::name, 'Should have id column');
SELECT has_column('public'::name, 'employees'::name, 'auth_id'::name, 'Should have auth_id column');
SELECT has_column('public'::name, 'employees'::name, 'email'::name, 'Should have email column');
SELECT has_column('public'::name, 'employees'::name, 'role'::name, 'Should have role column');
SELECT col_is_pk('public'::name, 'employees'::name, 'id'::name, 'employees.id should be primary key');

-- Test shift_options table structure
SELECT has_column('public'::name, 'shift_options'::name, 'id'::name, 'Should have id column');
SELECT has_column('public'::name, 'shift_options'::name, 'start_time'::name, 'Should have start_time column');
SELECT has_column('public'::name, 'shift_options'::name, 'end_time'::name, 'Should have end_time column');
SELECT has_column('public'::name, 'shift_options'::name, 'category'::name, 'Should have category column');
SELECT col_is_pk('public'::name, 'shift_options'::name, 'id'::name, 'shift_options.id should be primary key');

-- Test schedule_periods table structure
SELECT has_column('public'::name, 'schedule_periods'::name, 'id'::name, 'Should have id column');
SELECT has_column('public'::name, 'schedule_periods'::name, 'start_date'::name, 'Should have start_date column');
SELECT has_column('public'::name, 'schedule_periods'::name, 'end_date'::name, 'Should have end_date column');
SELECT col_is_pk('public'::name, 'schedule_periods'::name, 'id'::name, 'schedule_periods.id should be primary key');

-- Test individual_shifts table structure and foreign keys
SELECT has_column('public'::name, 'individual_shifts'::name, 'id'::name, 'Should have id column');
SELECT has_column('public'::name, 'individual_shifts'::name, 'employee_id'::name, 'Should have employee_id column');
SELECT has_column('public'::name, 'individual_shifts'::name, 'shift_option_id'::name, 'Should have shift_option_id column');
SELECT has_column('public'::name, 'individual_shifts'::name, 'schedule_period_id'::name, 'Should have schedule_period_id column');
SELECT col_is_pk('public'::name, 'individual_shifts'::name, 'id'::name, 'individual_shifts.id should be primary key');
SELECT fk_ok(
    'public', 'individual_shifts', 'employee_id',
    'public', 'employees', 'id'
);
SELECT fk_ok(
    'public', 'individual_shifts', 'shift_option_id',
    'public', 'shift_options', 'id'
);
SELECT fk_ok(
    'public', 'individual_shifts', 'schedule_period_id',
    'public', 'schedule_periods', 'id'
);

-- Test time_off_requests table structure
SELECT has_column('public'::name, 'time_off_requests'::name, 'id'::name, 'Should have id column');
SELECT has_column('public'::name, 'time_off_requests'::name, 'employee_id'::name, 'Should have employee_id column');
SELECT has_column('public'::name, 'time_off_requests'::name, 'start_date'::name, 'Should have start_date column');
SELECT has_column('public'::name, 'time_off_requests'::name, 'end_date'::name, 'Should have end_date column');
SELECT has_column('public'::name, 'time_off_requests'::name, 'status'::name, 'Should have status column');
SELECT col_is_pk('public'::name, 'time_off_requests'::name, 'id'::name, 'time_off_requests.id should be primary key');
SELECT fk_ok(
    'public', 'time_off_requests', 'employee_id',
    'public', 'employees', 'id'
);

-- Test enum types
SELECT has_type('public'::name, 'employee_role'::name, 'Should have employee_role enum type');
SELECT has_type('public'::name, 'shift_category'::name, 'Should have shift_category enum type');
SELECT has_type('public'::name, 'time_off_status'::name, 'Should have time_off_status enum type');
SELECT has_type('public'::name, 'shift_status'::name, 'Should have shift_status enum type');
SELECT has_type('public'::name, 'shift_pattern'::name, 'Should have shift_pattern enum type');
SELECT has_type('public'::name, 'log_severity'::name, 'Should have log_severity enum type');

-- Test indexes
SELECT has_index('public'::name, 'employees'::name, 'employees_auth_id_key', 'Should have index on auth_id');
SELECT has_index('public'::name, 'employees'::name, 'employees_email_key', 'Should have index on email');
SELECT has_index('public'::name, 'individual_shifts'::name, 'idx_individual_shifts_employee_date', 'Should have index on employee_id and date');
SELECT has_index('public'::name, 'individual_shifts'::name, 'idx_individual_shifts_status', 'Should have index on status');
SELECT has_index('public'::name, 'time_off_requests'::name, 'idx_time_off_requests_date_range', 'Should have index on date range');
SELECT has_index('public'::name, 'schedule_periods'::name, 'idx_schedule_periods_active', 'Should have index on active status');

-- Test additional tables and constraints
SELECT has_column('public'::name, 'shift_swap_requests'::name, 'requester_id'::name, 'Should have requester_id column');
SELECT has_column('public'::name, 'scheduling_logs'::name, 'severity'::name, 'Should have severity column');
SELECT has_column('public'::name, 'shift_assignment_scores'::name, 'total_score'::name, 'Should have total_score column');

-- Finish the tests and clean up
SELECT * FROM finish();
ROLLBACK; 