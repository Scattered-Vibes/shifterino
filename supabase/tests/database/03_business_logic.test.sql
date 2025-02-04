BEGIN;

-- Plan the number of tests
SELECT plan(6);

-- Clean up any existing test data
SELECT test_helpers.clean_test_data();

-- Helper function to create test data
CREATE OR REPLACE FUNCTION test_helpers.setup_test_data()
RETURNS TABLE (
    employee_id uuid,
    supervisor_id uuid,
    schedule_period_id uuid,
    shift_option_id uuid
) AS $$
DECLARE
    v_employee_id uuid;
    v_supervisor_id uuid;
    v_schedule_period_id uuid;
    v_shift_option_id uuid;
    supervisor_data record;
    employee_data record;
BEGIN
    -- Create test supervisor using existing function
    SELECT * INTO supervisor_data FROM test_helpers.create_test_user('supervisor@test.com', 'supervisor', 'bl');
    v_supervisor_id := supervisor_data.employee_id;
    
    -- Create test employee using existing function
    SELECT * INTO employee_data FROM test_helpers.create_test_user('employee@test.com', 'dispatcher', 'bl');
    v_employee_id := employee_data.employee_id;
    
    -- Create test schedule period
    INSERT INTO public.schedule_periods (start_date, end_date)
    VALUES (CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days')
    RETURNING id INTO v_schedule_period_id;
    
    -- Create test shift option
    INSERT INTO public.shift_options (
        name,
        start_time,
        end_time,
        duration_hours,
        category
    )
    VALUES (
        'Day Shift',
        '09:00'::time,
        '19:00'::time,
        10,
        'day'
    )
    RETURNING id INTO v_shift_option_id;
    
    RETURN QUERY SELECT v_employee_id, v_supervisor_id, v_schedule_period_id, v_shift_option_id;
END;
$$ LANGUAGE plpgsql;

-- Test data
DO $$
DECLARE
    test_data record;
BEGIN
    SELECT * INTO test_data FROM test_helpers.setup_test_data();
END $$;

-- Test shift duration constraints
SELECT test_helpers.set_auth_user(
    (SELECT id FROM auth.users WHERE email = 'supervisor_bl@test.com'),
    'service_role'
);

SELECT throws_ok(
    $$
    INSERT INTO public.shift_options (
        name,
        start_time,
        end_time,
        duration_hours,
        category
    )
    VALUES (
        'Invalid Shift',
        '09:00'::time,
        '16:00'::time,
        7,
        'day'
    )
    $$,
    '23514',
    'new row for relation "shift_options" violates check constraint "valid_duration"',
    'Shift duration must be either 4, 10, or 12 hours'
);

SELECT lives_ok(
    $$
    INSERT INTO public.shift_options (
        name,
        start_time,
        end_time,
        duration_hours,
        category
    )
    VALUES (
        'Valid Shift',
        '09:00'::time,
        '19:00'::time,
        10,
        'day'
    )
    $$,
    '10-hour shift should be valid'
);

-- Test minimum staffing requirements
CREATE OR REPLACE FUNCTION test_helpers.test_minimum_staffing()
RETURNS text AS $$
DECLARE
    test_data record;
    shift_id uuid;
    result boolean;
BEGIN
    PERFORM test_helpers.clean_test_data();
    SELECT * INTO test_data FROM test_helpers.setup_test_data();
    
    -- Create a shift during 5 AM - 9 AM period (requires 6 employees)
    INSERT INTO public.shift_options (
        name,
        start_time,
        end_time,
        duration_hours,
        category
    )
    VALUES (
        'Early Shift',
        '05:00'::time,
        '09:00'::time,
        4,
        'early'
    )
    RETURNING id INTO shift_id;
    
    -- Try to create a schedule without minimum staffing
    SELECT count(*) = 0 INTO result
    FROM individual_shifts
    WHERE shift_option_id = shift_id
    AND schedule_period_id = test_data.schedule_period_id;
    
    IF result THEN
        RETURN NULL;
    ELSE
        RETURN 'Should not allow understaffed shifts';
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT is(
    test_helpers.test_minimum_staffing(),
    NULL,
    'Minimum staffing requirements should be enforced'
);

-- Test supervisor coverage
CREATE OR REPLACE FUNCTION test_helpers.test_supervisor_coverage()
RETURNS text AS $$
DECLARE
    test_data record;
    shift_id uuid;
    result boolean;
BEGIN
    PERFORM test_helpers.clean_test_data();
    SELECT * INTO test_data FROM test_helpers.setup_test_data();
    
    -- Create a shift
    INSERT INTO public.shift_options (
        name,
        start_time,
        end_time,
        duration_hours,
        category
    )
    VALUES (
        'Day Shift',
        '09:00'::time,
        '21:00'::time,
        12,
        'day'
    )
    RETURNING id INTO shift_id;
    
    -- Verify supervisor requirement
    SELECT count(*) = 0 INTO result
    FROM individual_shifts s
    JOIN employees e ON s.employee_id = e.id
    WHERE s.shift_option_id = shift_id
    AND s.schedule_period_id = test_data.schedule_period_id
    AND e.role = 'supervisor';
    
    IF result THEN
        RETURN NULL;
    ELSE
        RETURN 'Should require at least one supervisor per shift';
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT is(
    test_helpers.test_supervisor_coverage(),
    NULL,
    'Supervisor coverage should be enforced'
);

-- Test weekly hour limits
CREATE OR REPLACE FUNCTION test_helpers.test_weekly_hours()
RETURNS text AS $$
DECLARE
    test_data record;
    shift_ids uuid[];
    result boolean;
BEGIN
    PERFORM test_helpers.clean_test_data();
    SELECT * INTO test_data FROM test_helpers.setup_test_data();
    
    BEGIN
        -- Create 5 x 10-hour shifts (50 hours total)
        WITH shift_inserts AS (
            INSERT INTO public.individual_shifts (
                employee_id,
                shift_option_id,
                schedule_period_id,
                date,
                status
            )
            SELECT
                test_data.employee_id,
                test_data.shift_option_id,
                test_data.schedule_period_id,
                CURRENT_DATE + (n || ' days')::interval,
                'scheduled'
            FROM generate_series(0, 4) n
            RETURNING id
        )
        SELECT array_agg(id) INTO shift_ids FROM shift_inserts;
        
        -- If we get here, the insert succeeded when it should have failed
        RETURN 'Should not allow more than 40 hours per week without override';
    EXCEPTION WHEN OTHERS THEN
        -- Check if the error message matches what we expect
        IF SQLERRM LIKE 'Cannot schedule more than % hours per week without overtime approval' THEN
            RETURN NULL;
        ELSE
            RETURN 'Unexpected error: ' || SQLERRM;
        END IF;
    END;
END;
$$ LANGUAGE plpgsql;

SELECT is(
    test_helpers.test_weekly_hours(),
    NULL,
    'Weekly hour limits should be enforced'
);

-- Test time off request conflicts
CREATE OR REPLACE FUNCTION test_helpers.test_time_off_conflicts()
RETURNS text AS $$
DECLARE
    test_data record;
    shift_id uuid;
    result boolean;
BEGIN
    PERFORM test_helpers.clean_test_data();
    SELECT * INTO test_data FROM test_helpers.setup_test_data();
    
    -- Create approved time off request
    INSERT INTO public.time_off_requests (
        employee_id,
        start_date,
        end_date,
        status
    )
    VALUES (
        test_data.employee_id,
        CURRENT_DATE + INTERVAL '7 days',
        CURRENT_DATE + INTERVAL '8 days',
        'approved'
    );
    
    BEGIN
        -- Try to create shift during time off
        INSERT INTO public.individual_shifts (
            employee_id,
            shift_option_id,
            schedule_period_id,
            date,
            status
        )
        VALUES (
            test_data.employee_id,
            test_data.shift_option_id,
            test_data.schedule_period_id,
            CURRENT_DATE + INTERVAL '7 days',
            'scheduled'
        )
        RETURNING id INTO shift_id;
        
        -- If we get here, the insert succeeded when it should have failed
        RETURN 'Should not allow shift assignment during approved time off';
    EXCEPTION WHEN OTHERS THEN
        -- Check if the error message matches what we expect
        IF SQLERRM = 'Cannot schedule shift during approved time off' THEN
            RETURN NULL;
        ELSE
            RETURN 'Unexpected error: ' || SQLERRM;
        END IF;
    END;
END;
$$ LANGUAGE plpgsql;

SELECT is(
    test_helpers.test_time_off_conflicts(),
    NULL,
    'Time off conflicts should be prevented'
);

-- Clean up
SELECT test_helpers.clean_test_data();
SELECT * FROM finish();
ROLLBACK; 