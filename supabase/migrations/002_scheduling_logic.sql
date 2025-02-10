-- 002_scheduling_logic.sql
--
-- This migration focuses on the scheduling logic, including:
--  - Tables for schedule_periods, individual_shifts, time_off_requests, shift_swap_requests
--  - Related functions, views, and triggers

-- Add new columns to existing shift_swap_requests table
ALTER TABLE shift_swap_requests
    ADD COLUMN IF NOT EXISTS requested_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES employees(id),
    ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_individual_shifts_overtime 
    ON individual_shifts (requested_overtime)
    WHERE requested_overtime = true;

CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_status 
    ON shift_swap_requests (status)
    WHERE status = 'pending';

-- Create on-call status type if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'on_call_status'
    ) THEN
        CREATE TYPE on_call_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
    END IF;
END $$;

-- Create on-call assignments table
CREATE TABLE IF NOT EXISTS on_call_assignments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id uuid NOT NULL REFERENCES employees(id),
    schedule_period_id uuid NOT NULL REFERENCES schedule_periods(id),
    start_date date NOT NULL,
    end_date date NOT NULL,
    status on_call_status NOT NULL DEFAULT 'scheduled',
    notes text,
    created_by uuid NOT NULL REFERENCES employees(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create on-call activations table for tracking when on-call staff are activated
CREATE TABLE IF NOT EXISTS on_call_activations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id uuid NOT NULL REFERENCES on_call_assignments(id),
    start_time timestamptz NOT NULL,
    end_time timestamptz,
    reason text NOT NULL,
    created_by uuid NOT NULL REFERENCES employees(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create function to swap shifts between employees
CREATE OR REPLACE FUNCTION swap_shifts(
    requesting_shift_id uuid,
    target_shift_id uuid
) RETURNS void AS $$
DECLARE
    v_requesting_employee_id uuid;
    v_target_employee_id uuid;
BEGIN
    -- Get the employee IDs from the shifts
    SELECT employee_id INTO v_requesting_employee_id
    FROM individual_shifts
    WHERE id = requesting_shift_id;

    SELECT employee_id INTO v_target_employee_id
    FROM individual_shifts
    WHERE id = target_shift_id;

    -- Swap the employee IDs
    UPDATE individual_shifts
    SET employee_id = v_target_employee_id
    WHERE id = requesting_shift_id;

    UPDATE individual_shifts
    SET employee_id = v_requesting_employee_id
    WHERE id = target_shift_id;

    -- Insert audit log entries
    INSERT INTO audit_logs (
        action_type,
        table_name,
        record_id,
        old_values,
        new_values,
        changed_by
    )
    VALUES
    (
        'SHIFT_SWAP',
        'individual_shifts',
        requesting_shift_id,
        jsonb_build_object('employee_id', v_requesting_employee_id),
        jsonb_build_object('employee_id', v_target_employee_id),
        auth.uid()
    ),
    (
        'SHIFT_SWAP',
        'individual_shifts',
        target_shift_id,
        jsonb_build_object('employee_id', v_target_employee_id),
        jsonb_build_object('employee_id', v_requesting_employee_id),
        auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_on_call_assignments_date_range 
    ON on_call_assignments USING gist (daterange(start_date, end_date, ''));

-- Create functions for audit logging
CREATE OR REPLACE FUNCTION log_audit_event() RETURNS trigger AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action_type,
        old_values,
        new_values,
        changed_by
    )
    VALUES (
        TG_TABLE_NAME,
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        TG_OP,
        CASE
            WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN to_jsonb(OLD)
            ELSE NULL
        END,
        CASE
            WHEN TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN to_jsonb(NEW)
            ELSE NULL
        END,
        auth.uid()
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging
DROP TRIGGER IF EXISTS audit_individual_shifts ON individual_shifts;
CREATE TRIGGER audit_individual_shifts
    AFTER INSERT OR UPDATE OR DELETE ON individual_shifts
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_shift_swap_requests ON shift_swap_requests;
CREATE TRIGGER audit_shift_swap_requests
    AFTER INSERT OR UPDATE OR DELETE ON shift_swap_requests
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_on_call_assignments ON on_call_assignments;
CREATE TRIGGER audit_on_call_assignments
    AFTER INSERT OR UPDATE OR DELETE ON on_call_assignments
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Create view for overtime reports
CREATE OR REPLACE VIEW overtime_reports AS
SELECT
    e.id as employee_id,
    e.first_name,
    e.last_name,
    sp.id as schedule_period_id,
    sp.start_date,
    sp.end_date,
    COUNT(DISTINCT is2.id) as total_shifts,
    SUM(
        CASE
            WHEN is2.requested_overtime THEN is2.overtime_hours
            ELSE 0
        END
    ) as total_overtime_hours,
    SUM(
        CASE
            WHEN is2.overtime_approved_by IS NOT NULL THEN is2.overtime_hours
            ELSE 0
        END
    ) as approved_overtime_hours
FROM
    employees e
    CROSS JOIN schedule_periods sp
    LEFT JOIN individual_shifts is2 ON e.id = is2.employee_id
        AND is2.date >= sp.start_date
        AND is2.date <= sp.end_date
GROUP BY
    e.id,
    e.first_name,
    e.last_name,
    sp.id,
    sp.start_date,
    sp.end_date;

-- Create view for staffing level reports
CREATE OR REPLACE VIEW staffing_level_reports AS
SELECT
    sr.id as requirement_id,
    sr.time_block_start as time_block,
    sr.min_total_staff,
    sr.min_supervisors,
    is2.date,
    COUNT(DISTINCT is2.id) as actual_staff_count,
    COUNT(
        DISTINCT CASE
            WHEN e.role = 'supervisor' THEN is2.id
        END
    ) as actual_supervisor_count,
    CASE
        WHEN COUNT(DISTINCT is2.id) < sr.min_total_staff THEN true
        ELSE false
    END as is_understaffed
FROM
    staffing_requirements sr
    CROSS JOIN (
        SELECT DISTINCT date
        FROM individual_shifts
    ) dates
    LEFT JOIN individual_shifts is2 ON is2.date = dates.date
        AND (
            is2.actual_start_time::time BETWEEN sr.time_block_start AND sr.time_block_end
            OR is2.actual_end_time::time BETWEEN sr.time_block_start AND sr.time_block_end
        )
    LEFT JOIN employees e ON is2.employee_id = e.id
GROUP BY
    sr.id,
    sr.time_block_start,
    sr.min_total_staff,
    sr.min_supervisors,
    is2.date;