-- Fix constraints and triggers
-- Up Migration

-- Add check constraint for day_of_week
ALTER TABLE shift_requirements
ADD CONSTRAINT shift_requirements_day_check 
CHECK (day_of_week >= 0 AND day_of_week <= 6);

COMMENT ON COLUMN shift_requirements.day_of_week IS 'Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)';

-- Update notifications table
ALTER TABLE notifications
DROP CONSTRAINT notifications_user_id_fkey,
ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE;

CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Update time_off_requests table
BEGIN;
  -- First, ensure all user_ids exist in employees table
  INSERT INTO employees (id, name, email, role)
  SELECT DISTINCT tor.user_id, au.email, au.email, 'dispatcher'
  FROM time_off_requests tor
  JOIN auth.users au ON au.id = tor.user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM employees e WHERE e.id = tor.user_id
  );

  -- Then update the foreign key
  ALTER TABLE time_off_requests
  DROP CONSTRAINT time_off_requests_user_id_fkey,
  ADD CONSTRAINT time_off_requests_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE;
COMMIT;

-- Fix time off notification trigger
CREATE OR REPLACE FUNCTION create_time_off_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        -- Only create notification if we have a valid employee_id
        IF NEW.user_id IS NOT NULL THEN
            INSERT INTO notifications (
                user_id,
                type,
                message,
                data
            )
            VALUES (
                NEW.user_id,
                'time_off_request',
                CASE 
                    WHEN NEW.status = 'approved' THEN 'Your time-off request has been approved'
                    WHEN NEW.status = 'rejected' THEN 'Your time-off request has been rejected'
                    ELSE 'Your time-off request status has been updated'
                END,
                jsonb_build_object(
                    'request_id', NEW.id,
                    'start_date', NEW.start_date,
                    'end_date', NEW.end_date,
                    'status', NEW.status,
                    'approved_by', NEW.approved_by
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add validation for overlapping shift requirements
CREATE OR REPLACE FUNCTION check_shift_requirements_overlap()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM shift_requirements sr
        WHERE sr.organization_id = NEW.organization_id
        AND sr.day_of_week = NEW.day_of_week
        AND sr.id != NEW.id
        AND (
            (NEW.start_time, NEW.end_time) OVERLAPS (sr.start_time, sr.end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Shift requirement overlaps with existing requirement';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_shift_requirements_overlap_trigger
    BEFORE INSERT OR UPDATE ON shift_requirements
    FOR EACH ROW
    EXECUTE FUNCTION check_shift_requirements_overlap();

-- Down Migration
-- In case we need to rollback these changes

-- Remove check constraint for day_of_week
ALTER TABLE shift_requirements
DROP CONSTRAINT IF EXISTS shift_requirements_day_check;

-- Revert notifications table changes
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

DROP INDEX IF EXISTS idx_notifications_created_at;

-- Revert time_off_requests table changes
ALTER TABLE time_off_requests
DROP CONSTRAINT IF EXISTS time_off_requests_user_id_fkey,
ADD CONSTRAINT time_off_requests_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop new trigger
DROP TRIGGER IF EXISTS check_shift_requirements_overlap_trigger ON shift_requirements;
DROP FUNCTION IF EXISTS check_shift_requirements_overlap();

-- Restore original notification trigger
CREATE OR REPLACE FUNCTION create_time_off_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO notifications (
            user_id,
            type,
            message,
            data
        )
        VALUES (
            NEW.user_id,
            'time_off_request',
            CASE 
                WHEN NEW.status = 'approved' THEN 'Your time-off request has been approved'
                WHEN NEW.status = 'rejected' THEN 'Your time-off request has been rejected'
                ELSE 'Your time-off request status has been updated'
            END,
            jsonb_build_object(
                'request_id', NEW.id,
                'start_date', NEW.start_date,
                'end_date', NEW.end_date,
                'status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 