BEGIN;

-- Test helper to create users with different roles
CREATE OR REPLACE FUNCTION test_helpers.create_test_employee(
  role text,
  team_id uuid DEFAULT NULL
) RETURNS TABLE (
  auth_id uuid,
  employee_id uuid
) AS $$
DECLARE
  v_auth_id uuid;
  v_employee_id uuid;
BEGIN
  -- Create auth user
  v_auth_id := gen_random_uuid();
  v_employee_id := gen_random_uuid();
  
  -- Create employee record
  INSERT INTO public.employees (id, auth_id, role, team_id)
  VALUES (v_employee_id, v_auth_id, role, team_id);
  
  RETURN QUERY SELECT v_auth_id, v_employee_id;
END;
$$ LANGUAGE plpgsql;

-- Test employees table policies
CREATE OR REPLACE FUNCTION test_helpers.test_employee_policies()
RETURNS SETOF text AS $$
BEGIN
  -- Create test users
  DECLARE
    dispatcher1 record;
    dispatcher2 record;
    supervisor1 record;
    supervisor2 record;
    manager record;
    team1_id uuid := gen_random_uuid();
    team2_id uuid := gen_random_uuid();
  BEGIN
    SELECT * INTO dispatcher1 FROM test_helpers.create_test_employee('dispatcher', team1_id);
    SELECT * INTO dispatcher2 FROM test_helpers.create_test_employee('dispatcher', team2_id);
    SELECT * INTO supervisor1 FROM test_helpers.create_test_employee('supervisor', team1_id);
    SELECT * INTO supervisor2 FROM test_helpers.create_test_employee('supervisor', team2_id);
    SELECT * INTO manager FROM test_helpers.create_test_employee('manager');
    
    -- Test dispatcher access
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" TO json_build_object('sub', dispatcher1.auth_id);
    
    RETURN NEXT ok(
      EXISTS (
        SELECT 1 FROM employees WHERE auth_id = dispatcher1.auth_id
      ),
      'Dispatcher can see own record'
    );
    
    RETURN NEXT ok(
      NOT EXISTS (
        SELECT 1 FROM employees WHERE auth_id = dispatcher2.auth_id
      ),
      'Dispatcher cannot see other dispatcher records'
    );
    
    -- Test supervisor access
    SET LOCAL "request.jwt.claims" TO json_build_object('sub', supervisor1.auth_id);
    
    RETURN NEXT ok(
      EXISTS (
        SELECT 1 FROM employees WHERE team_id = team1_id
      ),
      'Supervisor can see team members'
    );
    
    RETURN NEXT ok(
      NOT EXISTS (
        SELECT 1 FROM employees WHERE team_id = team2_id
      ),
      'Supervisor cannot see other team members'
    );
    
    -- Test manager access
    SET LOCAL "request.jwt.claims" TO json_build_object('sub', manager.auth_id);
    
    RETURN NEXT ok(
      (SELECT count(*) FROM employees) = 5,
      'Manager can see all employees'
    );
  END;
END;
$$ LANGUAGE plpgsql;

-- Test individual shifts table policies
CREATE OR REPLACE FUNCTION test_helpers.test_shift_policies()
RETURNS SETOF text AS $$
DECLARE
  dispatcher1 record;
  supervisor1 record;
  manager record;
  team1_id uuid := gen_random_uuid();
  shift_id uuid;
BEGIN
  -- Create test users and shifts
  SELECT * INTO dispatcher1 FROM test_helpers.create_test_employee('dispatcher', team1_id);
  SELECT * INTO supervisor1 FROM test_helpers.create_test_employee('supervisor', team1_id);
  SELECT * INTO manager FROM test_helpers.create_test_employee('manager');
  
  -- Create test shift
  INSERT INTO individual_shifts (
    id,
    employee_id,
    scheduled_start_time,
    scheduled_end_time,
    actual_start_time,
    actual_end_time,
    shift_type
  ) VALUES (
    gen_random_uuid(),
    dispatcher1.employee_id,
    NOW(),
    NOW() + interval '8 hours',
    NULL,
    NULL,
    'day'
  ) RETURNING id INTO shift_id;
  
  -- Test dispatcher access
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" TO json_build_object('sub', dispatcher1.auth_id);
  
  RETURN NEXT ok(
    EXISTS (
      SELECT 1 FROM individual_shifts WHERE employee_id = dispatcher1.employee_id
    ),
    'Dispatcher can see own shifts'
  );
  
  -- Test shift update by dispatcher
  UPDATE individual_shifts 
  SET actual_start_time = NOW()
  WHERE id = shift_id;
  
  RETURN NEXT ok(
    EXISTS (
      SELECT 1 FROM individual_shifts 
      WHERE id = shift_id AND actual_start_time IS NOT NULL
    ),
    'Dispatcher can update actual times'
  );
  
  -- Test supervisor access
  SET LOCAL "request.jwt.claims" TO json_build_object('sub', supervisor1.auth_id);
  
  RETURN NEXT ok(
    EXISTS (
      SELECT 1 FROM individual_shifts 
      WHERE employee_id IN (SELECT id FROM employees WHERE team_id = team1_id)
    ),
    'Supervisor can see team shifts'
  );
  
  -- Test manager access
  SET LOCAL "request.jwt.claims" TO json_build_object('sub', manager.auth_id);
  
  RETURN NEXT ok(
    EXISTS (
      SELECT 1 FROM individual_shifts
    ),
    'Manager can see all shifts'
  );
END;
$$ LANGUAGE plpgsql;

-- Test time off requests table policies
CREATE OR REPLACE FUNCTION test_helpers.test_time_off_policies()
RETURNS SETOF text AS $$
DECLARE
  dispatcher1 record;
  supervisor1 record;
  manager record;
  team1_id uuid := gen_random_uuid();
  request_id uuid;
BEGIN
  -- Create test users
  SELECT * INTO dispatcher1 FROM test_helpers.create_test_employee('dispatcher', team1_id);
  SELECT * INTO supervisor1 FROM test_helpers.create_test_employee('supervisor', team1_id);
  SELECT * INTO manager FROM test_helpers.create_test_employee('manager');
  
  -- Test dispatcher creating request
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" TO json_build_object('sub', dispatcher1.auth_id);
  
  INSERT INTO time_off_requests (
    id,
    employee_id,
    start_date,
    end_date,
    reason,
    status
  ) VALUES (
    gen_random_uuid(),
    dispatcher1.employee_id,
    CURRENT_DATE + 1,
    CURRENT_DATE + 2,
    'Test request',
    'pending'
  ) RETURNING id INTO request_id;
  
  RETURN NEXT ok(
    EXISTS (
      SELECT 1 FROM time_off_requests WHERE id = request_id
    ),
    'Dispatcher can create time off request'
  );
  
  -- Test supervisor approving request
  SET LOCAL "request.jwt.claims" TO json_build_object('sub', supervisor1.auth_id);
  
  UPDATE time_off_requests 
  SET status = 'approved'
  WHERE id = request_id;
  
  RETURN NEXT ok(
    EXISTS (
      SELECT 1 FROM time_off_requests 
      WHERE id = request_id AND status = 'approved'
    ),
    'Supervisor can approve time off request'
  );
  
  -- Test manager access
  SET LOCAL "request.jwt.claims" TO json_build_object('sub', manager.auth_id);
  
  RETURN NEXT ok(
    EXISTS (
      SELECT 1 FROM time_off_requests
    ),
    'Manager can see all time off requests'
  );
END;
$$ LANGUAGE plpgsql;

-- Run all tests
SELECT * FROM test_helpers.test_employee_policies();
SELECT * FROM test_helpers.test_shift_policies();
SELECT * FROM test_helpers.test_time_off_policies();

ROLLBACK; 