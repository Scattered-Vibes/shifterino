-- Final Policies and Recovery Functions

-- Enable RLS on new tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Allow function-created notifications
        (SELECT current_setting('app.is_system_function', true) = 'true')
        -- Allow managers to create notifications
        OR EXISTS (
            SELECT 1 FROM employees
            WHERE auth_id = auth.uid()
            AND role = 'manager'
        )
    );

-- Allow users to mark their own notifications as read
CREATE POLICY "Users can mark their notifications as read"
    ON notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (
        -- Only allow marking as read, no other changes
        is_read = true
    );

-- RLS Policies for audit logs
CREATE POLICY "Managers can view all audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE auth_id = auth.uid()
            AND role = 'manager'
        )
    );

CREATE POLICY "Users can view audit logs for their records"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (
        -- Can view logs where they made the change
        record_id = auth.uid()
        -- Or where the change affects their records
        OR (
            CASE
                WHEN table_name = 'shift_assignments' THEN
                    (changed_data->>'user_id')::UUID = auth.uid()
                WHEN table_name = 'time_off_requests' THEN
                    (changed_data->>'user_id')::UUID = auth.uid()
                ELSE false
            END
        )
    );

-- Function to set system context
CREATE OR REPLACE FUNCTION set_system_context(p_enabled BOOLEAN)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.is_system_function', p_enabled::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely generate schedule with error recovery
CREATE OR REPLACE FUNCTION generate_schedule_safe(
    p_start_date DATE,
    p_end_date DATE,
    p_organization_id UUID
) RETURNS TABLE (
    success BOOLEAN,
    schedule_id UUID,
    error_message TEXT
) AS $$
DECLARE
    v_schedule_id UUID;
    v_validation RECORD;
BEGIN
    -- Start transaction
    BEGIN
        -- Enable system context for notifications
        PERFORM set_system_context(true);
        
        -- Generate schedule
        v_schedule_id := generate_schedule(
            p_start_date,
            p_end_date,
            p_organization_id
        );
        
        -- Validate the generated schedule
        FOR v_validation IN
            SELECT * FROM test_schedule_validation(v_schedule_id)
            WHERE NOT passed
        LOOP
            -- If validation fails, raise exception
            RAISE EXCEPTION 'Schedule validation failed: %', v_validation.error_message;
        END LOOP;
        
        -- Create notifications for any issues
        PERFORM notify_coverage_gaps(v_schedule_id);
        PERFORM notify_pattern_violations(v_schedule_id);
        PERFORM notify_overtime(v_schedule_id);
        
        -- Disable system context
        PERFORM set_system_context(false);
        
        -- Return success
        RETURN QUERY
        SELECT true, v_schedule_id, NULL::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
        -- On error, rollback and return error info
        RETURN QUERY
        SELECT false, NULL::UUID, SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to safely optimize schedule with error recovery
CREATE OR REPLACE FUNCTION optimize_schedule_safe(
    p_schedule_id UUID
) RETURNS TABLE (
    success BOOLEAN,
    changes_made INTEGER,
    improvement_score NUMERIC,
    error_message TEXT
) AS $$
DECLARE
    v_changes INTEGER;
    v_score NUMERIC;
    v_validation RECORD;
BEGIN
    -- Start transaction
    BEGIN
        -- Enable system context for notifications
        PERFORM set_system_context(true);
        
        -- Optimize schedule
        SELECT changes_made, improvement_score
        INTO v_changes, v_score
        FROM optimize_schedule(p_schedule_id);
        
        -- Validate the optimized schedule
        FOR v_validation IN
            SELECT * FROM test_schedule_validation(p_schedule_id)
            WHERE NOT passed
        LOOP
            -- If validation fails, raise exception
            RAISE EXCEPTION 'Schedule validation failed after optimization: %', v_validation.error_message;
        END LOOP;
        
        -- Create notifications for any issues
        PERFORM notify_coverage_gaps(p_schedule_id);
        PERFORM notify_pattern_violations(p_schedule_id);
        PERFORM notify_overtime(p_schedule_id);
        
        -- Disable system context
        PERFORM set_system_context(false);
        
        -- Return success
        RETURN QUERY
        SELECT true, v_changes, v_score, NULL::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
        -- On error, rollback and return error info
        RETURN QUERY
        SELECT false, 0, 0::NUMERIC, SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to safely handle schedule transition with error recovery
CREATE OR REPLACE FUNCTION handle_schedule_transition_safe(
    p_old_schedule_id UUID,
    p_new_schedule_id UUID
) RETURNS TABLE (
    success BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_validation RECORD;
BEGIN
    -- Start transaction
    BEGIN
        -- Enable system context for notifications
        PERFORM set_system_context(true);
        
        -- Handle transition
        PERFORM handle_schedule_transition(
            p_old_schedule_id,
            p_new_schedule_id
        );
        
        -- Validate the new schedule
        FOR v_validation IN
            SELECT * FROM test_schedule_validation(p_new_schedule_id)
            WHERE NOT passed
        LOOP
            -- If validation fails, raise exception
            RAISE EXCEPTION 'Schedule validation failed after transition: %', v_validation.error_message;
        END LOOP;
        
        -- Create notifications for any issues
        PERFORM notify_coverage_gaps(p_new_schedule_id);
        PERFORM notify_pattern_violations(p_new_schedule_id);
        PERFORM notify_overtime(p_new_schedule_id);
        
        -- Disable system context
        PERFORM set_system_context(false);
        
        -- Return success
        RETURN QUERY
        SELECT true, NULL::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
        -- On error, rollback and return error info
        RETURN QUERY
        SELECT false, SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION set_system_context IS 'Sets context for system-level operations';
COMMENT ON FUNCTION generate_schedule_safe IS 'Safely generates a schedule with error recovery';
COMMENT ON FUNCTION optimize_schedule_safe IS 'Safely optimizes a schedule with error recovery';
COMMENT ON FUNCTION handle_schedule_transition_safe IS 'Safely handles schedule transition with error recovery'; 