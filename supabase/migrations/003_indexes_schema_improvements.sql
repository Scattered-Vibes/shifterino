-- 003_indexes_schema_improvements.sql
--
-- This migration consolidates indexes, performance optimizations,
-- additional data integrity constraints, audit logging, remote schema functions,
-- and schema version tracking.
--
-- Section 1: Indexes (from prior migrations)
DROP INDEX IF EXISTS idx_individual_shifts_employee_date;
DROP INDEX IF EXISTS idx_individual_shifts_status;
DROP INDEX IF EXISTS idx_time_off_requests_date_range;
DROP INDEX IF EXISTS idx_schedule_periods_active;

CREATE INDEX idx_individual_shifts_employee_date
  ON public.individual_shifts (employee_id, date);
CREATE INDEX idx_individual_shifts_status
  ON public.individual_shifts (status);
CREATE INDEX idx_time_off_requests_date_range
  ON public.time_off_requests (start_date, end_date);
CREATE INDEX idx_schedule_periods_active
  ON public.schedule_periods (is_active)
  WHERE is_active = true;

CREATE INDEX idx_individual_shifts_schedule_period
  ON public.individual_shifts (schedule_period_id);
CREATE INDEX idx_individual_shifts_shift_option
  ON public.individual_shifts (shift_option_id);
CREATE INDEX idx_individual_shifts_actual_times
  ON public.individual_shifts (actual_start_time, actual_end_time);

-- Section 2: Schema Improvements & Audit Logging (from 20250219_schema_improvements.sql)
CREATE EXTENSION IF NOT EXISTS btree_gist;  -- required for exclusion constraints

CREATE OR REPLACE FUNCTION verify_safe_migration()
RETURNS boolean AS $$
BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'shift_options'
    ) THEN
        RAISE EXCEPTION 'Required table shift_options does not exist';
    END IF;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

SELECT verify_safe_migration();

-- Schema Versions Table
CREATE TABLE IF NOT EXISTS public.schema_versions (
    version text PRIMARY KEY,
    applied_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    description text,
    created_by text DEFAULT current_user
);
COMMENT ON TABLE public.schema_versions IS 'Tracks database schema versions and migration history';
INSERT INTO public.schema_versions (version, description)
VALUES ('20250219', 'Added documentation, performance optimizations, and data integrity improvements');

-- Section 3: Data Integrity & Audit Logging Enhancements
-- Constraint for valid shift times (including midnight crossover)
ALTER TABLE public.shift_options 
  DROP CONSTRAINT IF EXISTS valid_shift_times,
  DROP CONSTRAINT IF EXISTS valid_duration;
  
ALTER TABLE public.shift_options 
ADD CONSTRAINT valid_shift_times 
CHECK (
    CASE 
        WHEN end_time < start_time THEN
            EXTRACT(EPOCH FROM (end_time - start_time + interval '24 hours'))/3600 <= 24
            AND EXTRACT(EPOCH FROM (end_time - start_time + interval '24 hours'))/3600 > 0
        ELSE
            EXTRACT(EPOCH FROM (end_time - start_time))/3600 <= 24
            AND EXTRACT(EPOCH FROM (end_time - start_time))/3600 > 0
    END
    AND
    CASE 
        WHEN end_time < start_time THEN
            ABS(duration_hours - EXTRACT(EPOCH FROM (end_time - start_time + interval '24 hours'))/3600) < 0.1
        ELSE
            ABS(duration_hours - EXTRACT(EPOCH FROM (end_time - start_time))/3600) < 0.1
    END
);

ALTER TABLE public.shift_options
ADD CONSTRAINT valid_duration
CHECK ( duration_hours IN (4, 8, 10, 12) );

-- Exclusion constraint for overlapping shifts
ALTER TABLE public.individual_shifts 
ADD CONSTRAINT no_overlapping_shifts 
EXCLUDE USING gist (
    employee_id WITH =,
    daterange(date, date + 1) WITH &&
);

-- Minimum rest period enforcement trigger & function
CREATE OR REPLACE FUNCTION validate_minimum_rest_period()
RETURNS trigger AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.individual_shifts s2
        WHERE s2.employee_id = NEW.employee_id
          AND s2.id != NEW.id
          AND s2.date = NEW.date + 1
          AND ( s2.actual_start_time < NEW.actual_end_time + interval '8 hours'
                OR NEW.actual_start_time < s2.actual_end_time + interval '8 hours' )
    ) THEN
        RAISE EXCEPTION 'Minimum rest period of 8 hours between shifts is required';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_minimum_rest_period
    BEFORE INSERT OR UPDATE ON public.individual_shifts
    FOR EACH ROW
    EXECUTE FUNCTION validate_minimum_rest_period();

-- Section 4: Audit Logging
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type text NOT NULL,
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    changed_by uuid REFERENCES auth.users(id),
    old_values jsonb,
    new_values jsonb,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION public.audit_changes()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.audit_logs (
        action_type,
        table_name,
        record_id,
        changed_by,
        old_values,
        new_values
    ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        auth.uid(),
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_individual_shifts
    AFTER INSERT OR UPDATE OR DELETE ON public.individual_shifts
    FOR EACH ROW EXECUTE FUNCTION public.audit_changes();
CREATE TRIGGER audit_time_off_requests
    AFTER INSERT OR UPDATE OR DELETE ON public.time_off_requests
    FOR EACH ROW EXECUTE FUNCTION public.audit_changes();
CREATE TRIGGER audit_staffing_requirements
    AFTER INSERT OR UPDATE OR DELETE ON public.staffing_requirements
    FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

-- Section 5: Remote Schema Functions
CREATE OR REPLACE FUNCTION auth.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN extensions.crypt(password, extensions.gen_salt('bf', 10));
END;
$$;

CREATE OR REPLACE FUNCTION auth.create_dispatcher_user(user_id uuid, email text, password text, role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'auth', 'public', 'extensions'
AS $$
DECLARE
    _encrypted_password text;
BEGIN
    _encrypted_password := auth.hash_password(password);
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        role, confirmation_token, aud
    )
    VALUES (
        user_id, '00000000-0000-0000-0000-000000000000', email, _encrypted_password,
        NOW(), jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
        jsonb_build_object('role', role), NOW(), NOW(), role,
        encode(gen_random_bytes(32), 'base64'), 'authenticated'
    );
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, created_at, updated_at, last_sign_in_at
    )
    VALUES (
        user_id, user_id, jsonb_build_object('sub', user_id::text, 'email', email, 'email_verified', true),
        'email', email, NOW(), NOW(), NOW()
    );
    INSERT INTO auth.refresh_tokens (
        instance_id, user_id, token, created_at, updated_at, parent, revoked
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000', user_id,
        encode(gen_random_bytes(48), 'base64'), NOW(), NOW(), NULL, false
    );
END;
$$;

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE auth.secrets TO service_role; 