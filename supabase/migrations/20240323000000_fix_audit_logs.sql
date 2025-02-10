-- Fix the audit_logs function to use the correct column name
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS trigger AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action_type,
        old_values,
        new_values,
        changed_by
    ) VALUES (
        TG_TABLE_NAME,
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        TG_OP,
        CASE
            WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE'
            THEN to_jsonb(OLD)
            ELSE NULL
        END,
        CASE
            WHEN TG_OP = 'UPDATE' OR TG_OP = 'INSERT'
            THEN to_jsonb(NEW)
            ELSE NULL
        END,
        auth.uid()
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the triggers to ensure they use the updated function
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

-- Add comment to document the change
COMMENT ON FUNCTION log_audit_event() IS 'Audit logging function that records changes to tables using the changed_by column'; 