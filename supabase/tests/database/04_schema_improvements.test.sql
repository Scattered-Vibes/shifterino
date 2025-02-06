-- 04_schema_improvements.test.sql
-- Tests for schema improvements migration

BEGIN;

-- Test helper to create a test employee
CREATE OR REPLACE FUNCTION create_test_employee()
RETURNS UUID AS $$
DECLARE
    employee_id UUID;
    shift_option_id UUID;
BEGIN
    -- Create test employee
    INSERT INTO public.employees (
        first_name,
        last_name,
        email,
        role,
        shift_pattern,
        auth_id
    ) VALUES (
        'Test',
        'Employee',
        'test' || gen_random_uuid() || '@test.com',
        'dispatcher',
        'pattern_a',
        gen_random_uuid()
    ) RETURNING id INTO employee_id;

    -- Create test shift option
    INSERT INTO public.shift_options (
        name,
        start_time,
        end_time,
        duration_hours,
        category
    ) VALUES (
        'Day Shift',
        '09:00',
        '17:00',
        8,
        'day'
    ) RETURNING id INTO shift_option_id;
    
    RETURN employee_id;
END;
$$ LANGUAGE plpgsql;

-- Test 1: Schema Version Tracking
SELECT plan(15);

SELECT has_table(
    'public', 'schema_versions',
    'schema_versions table should exist'
);

SELECT has_column(
    'public', 'schema_versions', 'version',
    'schema_versions should have version column'
);

-- Test 2: Shift Time Validation
DO $$
BEGIN
    -- Test 2.1: Regular shift (same day)
    INSERT INTO public.shift_options (
        name,
        start_time,
        end_time,
        duration_hours,
        category
    ) VALUES (
        'Valid Day Shift',
        '09:00',
        '17:00',
        8,
        'day'
    );

    -- Test 2.2: Valid shift crossing midnight
    INSERT INTO public.shift_options (
        name,
        start_time,
        end_time,
        duration_hours,
        category
    ) VALUES (
        'Valid Night Shift',
        '22:00',
        '06:00',
        8,
        'graveyard'
    );

    -- Test 2.3: Invalid shift (end before start, same day)
    BEGIN
        INSERT INTO public.shift_options (
            name,
            start_time,
            end_time,
            duration_hours,
            category
        ) VALUES (
            'Invalid Shift',
            '09:00',
            '08:00',
            4,
            'day'
        );
        ASSERT FALSE, 'Should not be able to insert shift with end time before start time (same day)';
    EXCEPTION WHEN check_violation THEN
        ASSERT TRUE, 'Correctly rejected invalid shift time (same day)';
    END;

    -- Test 2.4: Invalid shift (crossing midnight but duration too long)
    BEGIN
        INSERT INTO public.shift_options (
            name,
            start_time,
            end_time,
            duration_hours,
            category
        ) VALUES (
            'Invalid Long Night Shift',
            '22:00',
            '21:00',
            23,
            'graveyard'
        );
        ASSERT FALSE, 'Should not be able to insert shift with invalid duration crossing midnight';
    EXCEPTION WHEN check_violation THEN
        ASSERT TRUE, 'Correctly rejected invalid shift duration crossing midnight';
    END;

    -- Test 2.5: Invalid shift (duration doesn't match times)
    BEGIN
        INSERT INTO public.shift_options (
            name,
            start_time,
            end_time,
            duration_hours,
            category
        ) VALUES (
            'Invalid Duration Shift',
            '22:00',
            '06:00',
            10,  -- Actual duration is 8 hours
            'graveyard'
        );
        ASSERT FALSE, 'Should not be able to insert shift with mismatched duration';
    EXCEPTION WHEN check_violation THEN
        ASSERT TRUE, 'Correctly rejected shift with mismatched duration';
    END;

    -- Test 2.6: Valid swing shift crossing midnight
    INSERT INTO public.shift_options (
        name,
        start_time,
        end_time,
        duration_hours,
        category
    ) VALUES (
        'Valid Swing Shift',
        '15:00',
        '01:00',
        10,
        'swing'
    );

    -- Test 2.7: Valid graveyard shift
    INSERT INTO public.shift_options (
        name,
        start_time,
        end_time,
        duration_hours,
        category
    ) VALUES (
        'Valid Graveyard Shift',
        '19:00',
        '05:00',
        10,
        'graveyard'
    );

    -- Test 2.8: Invalid shift (exceeds maximum duration)
    BEGIN
        INSERT INTO public.shift_options (
            name,
            start_time,
            end_time,
            duration_hours,
            category
        ) VALUES (
            'Invalid Long Shift',
            '08:00',
            '07:00',
            23,  -- Exceeds maximum allowed duration
            'day'
        );
        ASSERT FALSE, 'Should not be able to insert shift exceeding maximum duration';
    EXCEPTION WHEN check_violation THEN
        ASSERT TRUE, 'Correctly rejected shift exceeding maximum duration';
    END;

END;
$$;

-- Test 3: Overlapping Shifts Prevention
DO $$
DECLARE
    employee_id UUID;
    shift_option_id UUID;
BEGIN
    employee_id := create_test_employee();
    
    -- Get a shift option
    SELECT id INTO shift_option_id FROM public.shift_options LIMIT 1;
    
    -- Insert first shift
    INSERT INTO public.individual_shifts (
        employee_id,
        shift_option_id,
        date,
        actual_start_time,
        actual_end_time
    ) VALUES (
        employee_id,
        shift_option_id,
        '2025-02-19',
        '2025-02-19 09:00:00',
        '2025-02-19 17:00:00'
    );
    
    -- Try to insert overlapping shift
    ASSERT EXISTS (
        SELECT 1
        FROM public.individual_shifts
        WHERE employee_id = employee_id
    ), 'First shift should be inserted';
    
    BEGIN
        INSERT INTO public.individual_shifts (
            employee_id,
            shift_option_id,
            date,
            actual_start_time,
            actual_end_time
        ) VALUES (
            employee_id,
            shift_option_id,
            '2025-02-19',
            '2025-02-19 16:00:00',
            '2025-02-19 20:00:00'
        );
        ASSERT FALSE, 'Should not be able to insert overlapping shift';
    EXCEPTION WHEN others THEN
        ASSERT TRUE, 'Overlapping shift was prevented';
    END;
END;
$$;

-- Test 4: Minimum Rest Period
DO $$
DECLARE
    employee_id UUID;
    shift_option_id UUID;
    error_message TEXT;
BEGIN
    employee_id := create_test_employee();
    
    -- Get a shift option
    SELECT id INTO shift_option_id FROM public.shift_options LIMIT 1;
    
    -- Insert first shift
    INSERT INTO public.individual_shifts (
        employee_id,
        shift_option_id,
        date,
        actual_start_time,
        actual_end_time
    ) VALUES (
        employee_id,
        shift_option_id,
        '2025-02-19',
        '2025-02-19 09:00:00',
        '2025-02-19 17:00:00'
    );
    
    -- Try to insert shift without enough rest
    BEGIN
        INSERT INTO public.individual_shifts (
            employee_id,
            shift_option_id,
            date,
            actual_start_time,
            actual_end_time
        ) VALUES (
            employee_id,
            shift_option_id,
            '2025-02-20',
            '2025-02-20 00:00:00',
            '2025-02-20 08:00:00'
        );
        ASSERT FALSE, 'Should not be able to insert shift without minimum rest';
    EXCEPTION WHEN others THEN
        GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
        ASSERT error_message LIKE '%Minimum rest period of 8 hours between shifts is required%',
            'Should fail with correct error message';
    END;
    
    -- Try to insert a valid shift with enough rest
    INSERT INTO public.individual_shifts (
        employee_id,
        shift_option_id,
        date,
        actual_start_time,
        actual_end_time
    ) VALUES (
        employee_id,
        shift_option_id,
        '2025-02-20',
        '2025-02-20 09:00:00',
        '2025-02-20 17:00:00'
    );
    
    -- Verify the valid shift was inserted
    ASSERT EXISTS (
        SELECT 1
        FROM public.individual_shifts
        WHERE employee_id = employee_id
        AND date = '2025-02-20'
        AND actual_start_time = '2025-02-20 09:00:00'::timestamptz
    ), 'Valid shift with enough rest should be inserted';
END;
$$;

-- Test 5: Audit Logging
DO $$
DECLARE
    employee_id UUID;
    shift_option_id UUID;
    audit_count INTEGER;
BEGIN
    employee_id := create_test_employee();
    
    -- Get a shift option
    SELECT id INTO shift_option_id FROM public.shift_options LIMIT 1;
    
    -- Insert a shift
    INSERT INTO public.individual_shifts (
        employee_id,
        shift_option_id,
        date,
        actual_start_time,
        actual_end_time
    ) VALUES (
        employee_id,
        shift_option_id,
        '2025-02-19',
        '2025-02-19 09:00:00',
        '2025-02-19 17:00:00'
    );
    
    -- Check audit log
    SELECT COUNT(*) INTO audit_count
    FROM public.audit_logs
    WHERE table_name = 'individual_shifts'
    AND action_type = 'INSERT';
    
    ASSERT audit_count = 1, 'Audit log should record shift insertion';
    
    -- Update the shift
    UPDATE public.individual_shifts
    SET actual_end_time = '2025-02-19 18:00:00'
    WHERE employee_id = employee_id;
    
    -- Check audit log again
    SELECT COUNT(*) INTO audit_count
    FROM public.audit_logs
    WHERE table_name = 'individual_shifts'
    AND action_type = 'UPDATE';
    
    ASSERT audit_count = 1, 'Audit log should record shift update';
END;
$$;

-- Test 6: Index Usage
EXPLAIN ANALYZE
SELECT *
FROM public.individual_shifts
WHERE employee_id = (SELECT id FROM public.employees LIMIT 1)
AND date = '2025-02-19';

-- Verify index is used in the plan
SELECT explain_contains(
    'SELECT * FROM public.individual_shifts WHERE employee_id = (SELECT id FROM public.employees LIMIT 1) AND date = ''2025-02-19''',
    'Index Scan',
    'Should use index for employee shifts query'
);

SELECT * FROM finish();
ROLLBACK; 