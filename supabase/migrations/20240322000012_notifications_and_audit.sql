-- Notifications and Audit Trail Functions

-- Create notification tables if they don't exist
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rename column if it exists with old name
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notifications'
        AND column_name = 'read'
    ) THEN
        ALTER TABLE notifications RENAME COLUMN "read" TO is_read;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT now()
);

-- Add or rename changed_by column if needed
DO $$
BEGIN
    -- Check if the column exists with a different name
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'audit_logs'
        AND column_name = 'user_id'
    ) THEN
        -- Rename user_id to changed_by
        ALTER TABLE audit_logs RENAME COLUMN user_id TO changed_by;
    ELSIF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'audit_logs'
        AND column_name = 'changed_by'
    ) THEN
        -- Add changed_by column if it doesn't exist
        ALTER TABLE audit_logs ADD COLUMN changed_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON audit_logs(changed_by);

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type notification_type,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_data
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to notify about coverage gaps
CREATE OR REPLACE FUNCTION notify_coverage_gaps(
    p_schedule_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_gap RECORD;
    v_notification_count INTEGER := 0;
    v_manager_ids UUID[];
    v_manager_id UUID;
BEGIN
    -- Get all managers
    SELECT ARRAY_AGG(auth_id)
    INTO v_manager_ids
    FROM employees
    WHERE role = 'manager';
    
    -- Check each coverage gap
    FOR v_gap IN
        SELECT *
        FROM analyze_schedule_coverage(p_schedule_id)
        WHERE coverage_status IN ('UNDERSTAFFED', 'NO_SUPERVISOR')
    LOOP
        -- Notify all managers
        FOREACH v_manager_id IN ARRAY v_manager_ids
        LOOP
            -- Insert notification for each manager
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                data
            ) VALUES (
                v_manager_id,
                'COVERAGE_GAP',
                'Coverage Gap Detected',
                format('Coverage gap detected for %s from %s to %s: %s',
                    v_gap.date,
                    v_gap.start_time,
                    v_gap.end_time,
                    v_gap.coverage_status
                ),
                jsonb_build_object(
                    'schedule_id', p_schedule_id,
                    'date', v_gap.date,
                    'start_time', v_gap.start_time,
                    'end_time', v_gap.end_time,
                    'status', v_gap.coverage_status
                )
            );
            v_notification_count := v_notification_count + 1;
        END LOOP;
    END LOOP;

    RETURN v_notification_count;
END;
$$ LANGUAGE plpgsql;

-- Function to notify about pattern violations
CREATE OR REPLACE FUNCTION notify_pattern_violations(
    p_schedule_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_violation RECORD;
    v_notification_count INTEGER := 0;
    v_manager_ids UUID[];
    v_manager_id UUID;
BEGIN
    -- Get all managers
    SELECT ARRAY_AGG(auth_id)
    INTO v_manager_ids
    FROM employees
    WHERE role = 'manager';
    
    -- Check each pattern violation
    FOR v_violation IN
        SELECT *
        FROM analyze_pattern_compliance(p_schedule_id)
        WHERE NOT pattern_compliant
    LOOP
        -- Notify employee
        PERFORM create_notification(
            v_violation.employee_id,
            'SHIFT_PATTERN_VIOLATION',
            'Shift Pattern Violation',
            format(
                'Your shifts for week of %s violate your assigned pattern: %s',
                v_violation.week_start,
                v_violation.violation_reason
            ),
            jsonb_build_object(
                'schedule_id', p_schedule_id,
                'week_start', v_violation.week_start,
                'pattern', v_violation.pattern,
                'violation', v_violation.violation_reason
            )
        );
        v_notification_count := v_notification_count + 1;
        
        -- Notify managers
        FOREACH v_manager_id IN ARRAY v_manager_ids
        LOOP
            PERFORM create_notification(
                v_manager_id,
                'SHIFT_PATTERN_VIOLATION',
                'Employee Pattern Violation',
                format(
                    '%s''s shifts for week of %s violate their pattern: %s',
                    v_violation.employee_name,
                    v_violation.week_start,
                    v_violation.violation_reason
                ),
                jsonb_build_object(
                    'schedule_id', p_schedule_id,
                    'employee_id', v_violation.employee_id,
                    'week_start', v_violation.week_start,
                    'pattern', v_violation.pattern,
                    'violation', v_violation.violation_reason
                )
            );
            v_notification_count := v_notification_count + 1;
        END LOOP;
    END LOOP;
    
    RETURN v_notification_count;
END;
$$ LANGUAGE plpgsql;

-- Function to notify about overtime
CREATE OR REPLACE FUNCTION notify_overtime(
    p_schedule_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_overtime RECORD;
    v_notification_count INTEGER := 0;
    v_manager_ids UUID[];
    v_manager_id UUID;
BEGIN
    -- Get all managers
    SELECT ARRAY_AGG(auth_id)
    INTO v_manager_ids
    FROM employees
    WHERE role = 'manager';
    
    -- Check each overtime instance
    FOR v_overtime IN
        SELECT *
        FROM analyze_overtime(p_schedule_id)
        WHERE NOT approved_overtime
    LOOP
        -- Notify employee
        PERFORM create_notification(
            v_overtime.employee_id,
            'OVERTIME_ALERT',
            'Overtime Alert',
            format(
                'You have %.1f hours of overtime scheduled for week of %s',
                v_overtime.overtime_hours,
                v_overtime.week_start
            ),
            jsonb_build_object(
                'schedule_id', p_schedule_id,
                'week_start', v_overtime.week_start,
                'total_hours', v_overtime.total_hours,
                'overtime_hours', v_overtime.overtime_hours
            )
        );
        v_notification_count := v_notification_count + 1;
        
        -- Notify managers
        FOREACH v_manager_id IN ARRAY v_manager_ids
        LOOP
            PERFORM create_notification(
                v_manager_id,
                'OVERTIME_ALERT',
                'Overtime Approval Required',
                format(
                    'Employee %s has %.1f hours of unapproved overtime for week of %s',
                    v_overtime.employee_id,
                    v_overtime.overtime_hours,
                    v_overtime.week_start
                ),
                jsonb_build_object(
                    'schedule_id', p_schedule_id,
                    'employee_id', v_overtime.employee_id,
                    'week_start', v_overtime.week_start,
                    'total_hours', v_overtime.total_hours,
                    'overtime_hours', v_overtime.overtime_hours
                )
            );
            v_notification_count := v_notification_count + 1;
        END LOOP;
    END LOOP;
    
    RETURN v_notification_count;
END;
$$ LANGUAGE plpgsql;

-- Function to log audit trail
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        changed_by
    ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE
            WHEN TG_OP = 'INSERT' THEN NULL
            ELSE to_jsonb(OLD)
        END,
        CASE
            WHEN TG_OP = 'DELETE' THEN NULL
            ELSE to_jsonb(NEW)
        END,
        auth.uid()
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for relevant tables
CREATE TRIGGER audit_shifts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON shifts
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_shift_assignments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON shift_assignments
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_time_off_requests_trigger
    AFTER INSERT OR UPDATE OR DELETE ON time_off_requests
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_trail();

-- Function to analyze audit trail
CREATE OR REPLACE FUNCTION analyze_audit_trail(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_table_name TEXT DEFAULT NULL
) RETURNS TABLE (
    date DATE,
    action TEXT,
    table_name TEXT,
    changes INTEGER,
    changed_by_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        date_trunc('day', al.changed_at)::DATE,
        al.action,
        al.table_name,
        COUNT(*),
        e.first_name || ' ' || e.last_name
    FROM audit_logs al
    LEFT JOIN employees e ON al.changed_by = e.auth_id
    WHERE al.changed_at BETWEEN p_start_date AND p_end_date
    AND (p_table_name IS NULL OR al.table_name = p_table_name)
    GROUP BY
        date_trunc('day', al.changed_at)::DATE,
        al.action,
        al.table_name,
        e.first_name,
        e.last_name
    ORDER BY
        date_trunc('day', al.changed_at)::DATE,
        al.table_name,
        al.action;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION create_notification IS 'Creates a new notification for a user';
COMMENT ON FUNCTION notify_coverage_gaps IS 'Notifies managers about coverage gaps in the schedule';
COMMENT ON FUNCTION notify_pattern_violations IS 'Notifies relevant users about shift pattern violations';
COMMENT ON FUNCTION notify_overtime IS 'Notifies about overtime and requests manager approval';
COMMENT ON FUNCTION log_audit_trail IS 'Logs changes to audited tables';
COMMENT ON FUNCTION analyze_audit_trail IS 'Analyzes audit trail data for reporting'; 