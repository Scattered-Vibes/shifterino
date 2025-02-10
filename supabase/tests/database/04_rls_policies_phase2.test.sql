BEGIN;

-- Test reference data policies (shift_options, staffing_requirements, schedule_periods)
CREATE OR REPLACE FUNCTION test_helpers.test_reference_data_policies()
RETURNS SETOF text AS $$
DECLARE
  dispatcher record;
  manager record;
BEGIN
  -- Create test users
  SELECT * INTO dispatcher FROM test_helpers.create_test_employee('dispatcher');
  SELECT * INTO manager FROM test_helpers.create_test_employee('manager');
  
  -- Test dispatcher read access
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" TO json_build_object('sub', dispatcher.auth_id);
  
  RETURN NEXT ok(
    EXISTS (SELECT 1 FROM shift_options),
    'Dispatcher can read shift options'
  );
  
  RETURN NEXT ok(
    EXISTS (SELECT 1 FROM staffing_requirements),
    'Dispatcher can read staffing requirements'
  );
  
  RETURN NEXT ok(
    EXISTS (SELECT 1 FROM schedule_periods),
    'Dispatcher can read schedule periods'
  );
  
  -- Test dispatcher cannot modify
  PREPARE insert_shift_option AS 
    INSERT INTO shift_options (name, duration_hours) VALUES ('test', 8);
  
  RETURN NEXT throws_ok(
    'insert_shift_option',
    NULL,
    'new row violates row-level security policy',
    'Dispatcher cannot insert shift options'
  );
  
  -- Test manager full access
  SET LOCAL "request.jwt.claims" TO json_build_object('sub', manager.auth_id);
  
  -- Can read
  RETURN NEXT ok(
    EXISTS (SELECT 1 FROM shift_options),
    'Manager can read shift options'
  );
  
  -- Can modify
  RETURN NEXT lives_ok(
    'insert_shift_option',
    'Manager can insert shift options'
  );
END;
$$ LANGUAGE plpgsql;

-- Test schedules policies
CREATE OR REPLACE FUNCTION test_helpers.test_schedules_policies()
RETURNS SETOF text AS $$
DECLARE
  dispatcher1 record;
  dispatcher2 record;
  supervisor record;
  manager record;
  team_id uuid := gen_random_uuid();
  schedule_id uuid;
BEGIN
  -- Create test users
  SELECT * INTO dispatcher1 FROM test_helpers.create_test_employee('dispatcher', team_id);
  SELECT * INTO dispatcher2 FROM test_helpers.create_test_employee('dispatcher');
  SELECT * INTO supervisor FROM test_helpers.create_test_employee('supervisor', team_id);
  SELECT * INTO manager FROM test_helpers.create_test_employee('manager');
  
  -- Create test schedule
  INSERT INTO schedules (
    id,
    employee_id,
    period_id,
    status
  ) VALUES (
    gen_random_uuid(),
    dispatcher1.employee_id,
    gen_random_uuid(),
    'draft'
  ) RETURNING id INTO schedule_id;
  
  -- Test dispatcher access
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" TO json_build_object('sub', dispatcher1.auth_id);
  
  RETURN NEXT ok(
    EXISTS (
      SELECT 1 FROM schedules WHERE employee_id = dispatcher1.employee_id
    ),
    'Dispatcher can see own schedules'
  );
  
  RETURN NEXT ok(
    NOT EXISTS (
      SELECT 1 FROM schedules WHERE employee_id = dispatcher2.employee_id
    ),
    'Dispatcher cannot see other schedules'
  );
  
  -- Test supervisor access
  SET LOCAL "request.jwt.claims" TO json_build_object('sub', supervisor.auth_id);
  
  RETURN NEXT ok(
    EXISTS (
      SELECT 1 FROM schedules 
      WHERE employee_id IN (SELECT id FROM employees WHERE team_id = team_id)
    ),
    'Supervisor can see team schedules'
  );
  
  -- Test manager access
  SET LOCAL "request.jwt.claims" TO json_build_object('sub', manager.auth_id);
  
  RETURN NEXT ok(
    EXISTS (SELECT 1 FROM schedules),
    'Manager can see all schedules'
  );
END;
$$ LANGUAGE plpgsql;

-- Test audit logging
CREATE OR REPLACE FUNCTION test_helpers.test_audit_logging()
RETURNS SETOF text AS $$
DECLARE
  manager record;
  employee_id uuid;
  log_count integer;
BEGIN
  -- Create test manager
  SELECT * INTO manager FROM test_helpers.create_test_employee('manager');
  
  -- Set role to manager
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" TO json_build_object('sub', manager.auth_id);
  
  -- Create test employee
  INSERT INTO employees (id, auth_id, role)
  VALUES (gen_random_uuid(), gen_random_uuid(), 'dispatcher')
  RETURNING id INTO employee_id;
  
  -- Check log was created
  SELECT count(*) INTO log_count 
  FROM scheduling_logs 
  WHERE operation = 'INSERT' 
  AND table_name = 'employees'
  AND record_id = employee_id;
  
  RETURN NEXT ok(
    log_count = 1,
    'Audit log created for employee insert'
  );
  
  -- Update employee
  UPDATE employees SET role = 'supervisor' WHERE id = employee_id;
  
  -- Check update log
  SELECT count(*) INTO log_count 
  FROM scheduling_logs 
  WHERE operation = 'UPDATE' 
  AND table_name = 'employees'
  AND record_id = employee_id;
  
  RETURN NEXT ok(
    log_count = 1,
    'Audit log created for employee update'
  );
  
  -- Delete employee
  DELETE FROM employees WHERE id = employee_id;
  
  -- Check delete log
  SELECT count(*) INTO log_count 
  FROM scheduling_logs 
  WHERE operation = 'DELETE' 
  AND table_name = 'employees'
  AND record_id = employee_id;
  
  RETURN NEXT ok(
    log_count = 1,
    'Audit log created for employee delete'
  );
END;
$$ LANGUAGE plpgsql;

-- Test system settings and test data policies
CREATE OR REPLACE FUNCTION test_helpers.test_restricted_tables()
RETURNS SETOF text AS $$
DECLARE
  manager record;
BEGIN
  -- Create test manager
  SELECT * INTO manager FROM test_helpers.create_test_employee('manager');
  
  -- Set role to manager
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" TO json_build_object('sub', manager.auth_id);
  
  -- Test system settings access
  PREPARE insert_system_setting AS
    INSERT INTO system_settings (key, value) VALUES ('test', 'value');
  
  RETURN NEXT throws_ok(
    'insert_system_setting',
    NULL,
    'new row violates row-level security policy',
    'Even manager cannot access system settings'
  );
  
  -- Test test data access
  PREPARE insert_test_data AS
    INSERT INTO test_data (name) VALUES ('test');
  
  RETURN NEXT throws_ok(
    'insert_test_data',
    NULL,
    'new row violates row-level security policy',
    'Test data is restricted in production'
  );
  
  -- Test development environment access
  SET LOCAL app.settings.environment = 'development';
  
  RETURN NEXT lives_ok(
    'insert_test_data',
    'Test data is accessible in development'
  );
END;
$$ LANGUAGE plpgsql;

-- Run all tests
SELECT * FROM test_helpers.test_reference_data_policies();
SELECT * FROM test_helpers.test_schedules_policies();
SELECT * FROM test_helpers.test_audit_logging();
SELECT * FROM test_helpers.test_restricted_tables();

ROLLBACK; 