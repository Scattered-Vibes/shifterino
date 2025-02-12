-- 20240317000000_init.sql
--
-- Unified migration file for the 911 Dispatch Scheduling System

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist; -- Required for exclusion constraints

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create required enum types
DO $$ BEGIN
    CREATE TYPE auth.aal_level AS ENUM ('aal1', 'aal2', 'aal3');
    CREATE TYPE auth.factor_type AS ENUM ('totp', 'webauthn');
    CREATE TYPE auth.factor_status AS ENUM ('unverified', 'verified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- --- Enum Types ---
DO $$ BEGIN
    DROP TYPE IF EXISTS public.employee_role CASCADE;
    DROP TYPE IF EXISTS public.shift_pattern CASCADE;
    DROP TYPE IF EXISTS public.shift_category CASCADE;
    DROP TYPE IF EXISTS public.time_off_status CASCADE;
    DROP TYPE IF EXISTS public.shift_status CASCADE;
    DROP TYPE IF EXISTS public.swap_request_status CASCADE;
    DROP TYPE IF EXISTS public.on_call_status CASCADE;
    DROP TYPE IF EXISTS holiday_type CASCADE;
    DROP TYPE IF EXISTS schedule_status CASCADE;

    -- Create enums with correct values
    CREATE TYPE public.employee_role AS ENUM ('dispatcher', 'supervisor', 'manager');
    CREATE TYPE holiday_type AS ENUM ('FEDERAL', 'COMPANY', 'OTHER');
    CREATE TYPE public.shift_pattern AS ENUM ('4_10', '3_12_4', 'CUSTOM');
    CREATE TYPE public.shift_category AS ENUM ('DAY', 'SWING', 'NIGHT');
    CREATE TYPE public.shift_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
    CREATE TYPE public.schedule_status AS ENUM ('draft', 'published', 'archived');
    CREATE TYPE public.time_off_status AS ENUM ('pending', 'approved', 'rejected');
    CREATE TYPE public.swap_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
    CREATE TYPE public.on_call_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
END $$;

-- Create auth.users table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.users (
    instance_id uuid,
    id uuid NOT NULL PRIMARY KEY,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone character varying(255) UNIQUE,
    phone_confirmed_at timestamp with time zone,
    phone_change character varying(255) DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false,
    deleted_at timestamp with time zone
);

-- Create auth.refresh_tokens table
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    instance_id uuid,
    id bigserial PRIMARY KEY,
    token character varying(255),
    user_id uuid REFERENCES auth.users(id),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255)
);

-- Create auth.instances table
CREATE TABLE IF NOT EXISTS auth.instances (
    id uuid NOT NULL PRIMARY KEY,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- Create auth.sessions table
CREATE TABLE IF NOT EXISTS auth.sessions (
    id uuid NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal aal_level
);

-- Create auth.mfa_factors table
CREATE TABLE IF NOT EXISTS auth.mfa_factors (
    id uuid NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    friendly_name text,
    factor_type factor_type,
    status factor_status,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    secret text
);

-- Create auth.mfa_challenges table
CREATE TABLE IF NOT EXISTS auth.mfa_challenges (
    id uuid NOT NULL PRIMARY KEY,
    factor_id uuid REFERENCES auth.mfa_factors(id),
    created_at timestamp with time zone,
    verified_at timestamp with time zone,
    ip_address inet
);

-- Create auth.mfa_amr_claims table
CREATE TABLE IF NOT EXISTS auth.mfa_amr_claims (
    session_id uuid REFERENCES auth.sessions(id),
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text,
    id uuid NOT NULL PRIMARY KEY
);

-- Create indexes
CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users(instance_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users(email);
CREATE INDEX IF NOT EXISTS users_phone_idx ON auth.users(phone);
CREATE INDEX IF NOT EXISTS refresh_tokens_instance_id_idx ON auth.refresh_tokens(instance_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens(instance_id, user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_token_idx ON auth.refresh_tokens(token);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON auth.sessions(user_id);
CREATE INDEX IF NOT EXISTS mfa_factors_user_id_idx ON auth.mfa_factors(user_id);
CREATE INDEX IF NOT EXISTS mfa_challenges_factor_id_idx ON auth.mfa_challenges(factor_id);
CREATE INDEX IF NOT EXISTS mfa_amr_claims_session_id_idx ON auth.mfa_amr_claims(session_id);

-- Grant permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres, service_role;

-- Grant specific permissions to anon and authenticated roles
GRANT SELECT ON TABLE auth.users TO anon, authenticated;
GRANT SELECT ON TABLE auth.refresh_tokens TO anon, authenticated;
GRANT SELECT ON TABLE auth.sessions TO anon, authenticated;
GRANT SELECT ON TABLE auth.mfa_factors TO anon, authenticated;
GRANT SELECT ON TABLE auth.mfa_challenges TO anon, authenticated;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO anon, authenticated;

-- --- Helper Functions ---

-- Function to get the currently authenticated user's ID
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub',
      null
    )::uuid;
$$;

-- Function to check if user is manager
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.employees
    WHERE auth_id = auth.uid()::uuid
    AND role = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is supervisor or above
CREATE OR REPLACE FUNCTION public.is_supervisor_or_above()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.employees
    WHERE auth_id = auth.uid()::uuid
    AND role IN ('supervisor', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get team members for a supervisor
CREATE OR REPLACE FUNCTION public.get_team_members()
RETURNS TABLE (employee_id uuid) AS $$
BEGIN
    RETURN QUERY
    SELECT e.id
    FROM public.employees e
    WHERE EXISTS (
      SELECT 1 FROM public.employees supervisor
      WHERE supervisor.auth_id = auth.uid()::uuid
      AND supervisor.role IN ('supervisor', 'manager')
      AND e.team_id = supervisor.team_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to set created_by on insert
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS trigger AS $$
BEGIN
    NEW.created_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set updated_by on update
CREATE OR REPLACE FUNCTION set_updated_by()
RETURNS trigger AS $$
BEGIN
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.employees (auth_id, email, first_name, last_name, role, shift_pattern)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    (COALESCE(NEW.raw_user_meta_data->>'role', 'dispatcher'))::public.employee_role,
    (COALESCE(NEW.raw_user_meta_data->>'shift_pattern', '4_10'))::public.shift_pattern
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- Grant auth schema permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres, service_role;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --- Core Tables ---

-- Employees Table (Primary table for user data)
CREATE TABLE IF NOT EXISTS public.employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,  -- Assuming auth.users exists
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL UNIQUE,
    role employee_role NOT NULL,
    weekly_hours_cap integer NOT NULL DEFAULT 40,
    max_overtime_hours integer DEFAULT 0,
    profile_completed boolean DEFAULT true,
    is_active boolean NOT NULL DEFAULT true,
    team_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    supervisor_id uuid REFERENCES auth.users(id),
    shift_pattern shift_pattern NOT NULL DEFAULT '4_10',
    preferred_shift_category shift_category NOT NULL DEFAULT 'DAY',
    CONSTRAINT valid_hours_cap CHECK (weekly_hours_cap > 0 AND weekly_hours_cap <= 168),
    CONSTRAINT valid_overtime CHECK (max_overtime_hours >= 0 AND max_overtime_hours <= 40)
);

-- Shift Options Table (Reference data for shift types)
CREATE TABLE IF NOT EXISTS public.shift_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    duration_hours integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    category shift_category NOT NULL DEFAULT 'DAY',
    CONSTRAINT valid_duration CHECK (duration_hours IN (4, 10, 12)),
    CONSTRAINT valid_times CHECK (
        (start_time < end_time) OR  -- Normal shifts within same day
        (category IN ('SWING', 'NIGHT') AND start_time > end_time)  -- Shifts that cross midnight
    ),
    CONSTRAINT valid_shift_duration
    CHECK (
        duration_hours =
        CASE
            WHEN end_time >= start_time THEN
                EXTRACT(EPOCH FROM (end_time - start_time))/3600
            ELSE
                EXTRACT(EPOCH FROM (end_time - start_time + interval '24 hours'))/3600
        END
    ),
    CONSTRAINT unique_shift_option_name_per_category UNIQUE (name, category)
);

-- Schedule Periods Table (Defines scheduling periods)
CREATE TABLE IF NOT EXISTS public.schedule_periods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    start_date date NOT NULL,
    end_date date NOT NULL,
    description text,
    is_published boolean DEFAULT false,
    published_at timestamptz,
    published_by uuid REFERENCES public.employees(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT valid_date_range CHECK (end_date > start_date),
    CONSTRAINT valid_publish_state CHECK (
        (NOT is_published AND published_at IS NULL AND published_by IS NULL) OR
        (is_published AND published_at IS NOT NULL AND published_by IS NOT NULL)
    )
);

-- Staffing Requirements Table
CREATE TABLE IF NOT EXISTS public.staffing_requirements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_period_id uuid NOT NULL REFERENCES public.schedule_periods(id),
    time_block_start time NOT NULL,
    time_block_end time NOT NULL,
    day_of_week smallint NOT NULL,
    min_total_staff integer NOT NULL,
    min_supervisors integer NOT NULL DEFAULT 1,
    is_holiday boolean DEFAULT false,
    override_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT valid_staff_counts CHECK (
        min_total_staff >= min_supervisors AND
        min_supervisors >= 0 AND
        min_total_staff > 0
    ),
    CONSTRAINT valid_time_block CHECK (
        (time_block_start < time_block_end) OR  -- Normal time blocks
        (time_block_start > time_block_end)      -- Time blocks that cross midnight
    ),
    CONSTRAINT valid_day_of_week CHECK (day_of_week BETWEEN 0 AND 6)
);

-- Schedules Table (Combined schedules and individual_shifts)
CREATE TABLE IF NOT EXISTS public.schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES public.employees(id),
    shift_option_id uuid NOT NULL REFERENCES public.shift_options(id),
    schedule_period_id uuid NOT NULL REFERENCES public.schedule_periods(id),
    date date NOT NULL,
    is_overtime boolean NOT NULL DEFAULT false,
    actual_start_time timestamptz,
    actual_end_time timestamptz,
    break_start_time timestamptz,
    break_end_time timestamptz,
    break_duration_minutes integer,
    actual_hours_worked decimal(5,2),
    notes text,
    overtime_approved boolean DEFAULT false,
    overtime_approved_by uuid REFERENCES public.employees(id),
    overtime_approved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    status shift_status NOT NULL DEFAULT 'scheduled',
    CONSTRAINT valid_break_times CHECK (
        (break_start_time IS NULL AND break_end_time IS NULL) OR
        (break_start_time IS NOT NULL AND break_end_time IS NOT NULL AND break_start_time < break_end_time)
    ),
    CONSTRAINT valid_actual_times CHECK (
        (actual_start_time IS NULL AND actual_end_time IS NULL) OR
        (actual_start_time IS NOT NULL AND actual_end_time IS NOT NULL AND actual_start_time < actual_end_time)
    ),
    CONSTRAINT valid_break_duration CHECK (
        break_duration_minutes IS NULL OR
        (break_duration_minutes >= 0 AND break_duration_minutes <= 60)
    ),
    CONSTRAINT valid_hours_worked CHECK (
        actual_hours_worked IS NULL OR
        (actual_hours_worked >= 0 AND actual_hours_worked <= 24)
    ),
    CONSTRAINT overtime_approval_complete CHECK (
        (NOT overtime_approved AND overtime_approved_by IS NULL AND overtime_approved_at IS NULL) OR
        (overtime_approved AND overtime_approved_by IS NOT NULL AND overtime_approved_at IS NOT NULL)
    ),
    CONSTRAINT no_overlapping_shifts UNIQUE (employee_id, date, shift_option_id)
);

-- Time Off Requests Table
CREATE TABLE IF NOT EXISTS public.time_off_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES public.employees(id),
    start_date date NOT NULL,
    end_date date NOT NULL,
    status time_off_status NOT NULL DEFAULT 'pending',
    reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT valid_time_off_dates CHECK (end_date >= start_date)
);

-- Shift Swap Requests Table
CREATE TABLE IF NOT EXISTS public.shift_swap_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    requesting_employee_id uuid NOT NULL REFERENCES public.employees(id),
    receiving_employee_id uuid REFERENCES public.employees(id),
    requesting_shift_id uuid NOT NULL REFERENCES public.schedules(id),
    receiving_shift_id uuid REFERENCES public.schedules(id),
    status swap_request_status NOT NULL DEFAULT 'pending',
    requested_at timestamptz NOT NULL DEFAULT now(),
    approved_rejected_at timestamptz,
    approved_rejected_by uuid REFERENCES public.employees(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT valid_swap_request CHECK (
        (receiving_employee_id IS NULL AND receiving_shift_id IS NULL) OR
        (receiving_employee_id IS NOT NULL AND receiving_shift_id IS NOT NULL)
    ),
    CONSTRAINT valid_approval_rejection CHECK (
        (status != 'approved' AND status != 'rejected' AND approved_rejected_at IS NULL AND approved_rejected_by IS NULL) OR
        ((status = 'approved' OR status = 'rejected') AND approved_rejected_at IS NOT NULL AND approved_rejected_by IS NOT NULL)
    )
);

-- On-Call Assignments Table
CREATE TABLE IF NOT EXISTS public.on_call_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES public.employees(id),
    schedule_period_id uuid NOT NULL REFERENCES public.schedule_periods(id),
    start_datetime timestamptz NOT NULL,
    end_datetime timestamptz NOT NULL,
    status on_call_status NOT NULL DEFAULT 'scheduled',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT valid_on_call_period CHECK (end_datetime > start_datetime)
);

-- On-Call Activations Table
CREATE TABLE IF NOT EXISTS public.on_call_activations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id uuid NOT NULL REFERENCES public.on_call_assignments(id),
    activation_time timestamptz NOT NULL,
    deactivation_time timestamptz,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT valid_activation_period CHECK (
        (deactivation_time IS NULL) OR (deactivation_time > activation_time)
    )
);

-- Holidays Table (from 20250320)
CREATE TABLE IF NOT EXISTS holidays (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    name text NOT NULL,
    type holiday_type NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Individual Shifts Table (from 20250320)
CREATE TABLE IF NOT EXISTS individual_shifts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES employees(id),
    shift_option_id uuid NOT NULL REFERENCES shift_options(id),
    schedule_period_id uuid NOT NULL REFERENCES schedule_periods(id),
    date date NOT NULL,
    status shift_status NOT NULL DEFAULT 'scheduled',
    actual_start_time timestamptz,
    actual_end_time timestamptz,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- Shift Pattern Rules Table (from 20250320)
CREATE TABLE IF NOT EXISTS shift_pattern_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES employees(id),
    pattern shift_pattern NOT NULL,
    start_date date NOT NULL,
    end_date date,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- --- Indexes ---

-- Employees indexes
CREATE INDEX IF NOT EXISTS idx_employees_auth_id ON public.employees (auth_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees (role);
CREATE INDEX IF NOT EXISTS idx_employees_team ON public.employees (team_id) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees (email);
CREATE INDEX IF NOT EXISTS idx_employees_name ON public.employees (first_name, last_name);

-- Shift options indexes
CREATE INDEX IF NOT EXISTS idx_shift_options_category ON public.shift_options (category);
CREATE INDEX IF NOT EXISTS idx_shift_options_duration ON public.shift_options (duration_hours);

-- Schedule periods indexes
CREATE INDEX IF NOT EXISTS idx_schedule_periods_dates ON public.schedule_periods (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_schedule_periods_published ON public.schedule_periods (is_published);

-- Staffing requirements indexes
CREATE INDEX IF NOT EXISTS idx_staffing_requirements_period ON public.staffing_requirements (schedule_period_id);
CREATE INDEX IF NOT EXISTS idx_staffing_requirements_time_block
    ON public.staffing_requirements (time_block_start, time_block_end);

-- Schedules indexes
CREATE INDEX IF NOT EXISTS idx_schedules_employee ON public.schedules (employee_id);
CREATE INDEX IF NOT EXISTS idx_schedules_shift_option ON public.schedules (shift_option_id);
CREATE INDEX IF NOT EXISTS idx_schedules_period ON public.schedules (schedule_period_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.schedules (date);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON public.schedules (status);
CREATE INDEX IF NOT EXISTS idx_schedules_overtime ON public.schedules (is_overtime) WHERE is_overtime = true;
CREATE INDEX IF NOT EXISTS idx_schedules_date_range ON public.schedules (date, schedule_period_id);
CREATE INDEX IF NOT EXISTS idx_schedules_employee_date ON public.schedules (employee_id, date);

-- Time off requests indexes
CREATE INDEX IF NOT EXISTS idx_time_off_employee ON public.time_off_requests (employee_id);
CREATE INDEX IF NOT EXISTS idx_time_off_dates ON public.time_off_requests (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_time_off_status ON public.time_off_requests (status);
CREATE INDEX IF NOT EXISTS idx_time_off_employee_date ON public.time_off_requests (employee_id, start_date, end_date);

-- Shift swap requests indexes
CREATE INDEX IF NOT EXISTS idx_swap_requests_employees ON public.shift_swap_requests (requesting_employee_id, receiving_employee_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_shifts ON public.shift_swap_requests (requesting_shift_id, receiving_shift_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON public.shift_swap_requests (status);

-- On-call assignments indexes
CREATE INDEX IF NOT EXISTS idx_on_call_assignments_employee ON public.on_call_assignments (employee_id);
CREATE INDEX IF NOT EXISTS idx_on_call_assignments_period ON public.on_call_assignments (schedule_period_id);
CREATE INDEX IF NOT EXISTS idx_on_call_assignments_dates ON public.on_call_assignments (start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_on_call_assignments_status ON public.on_call_assignments (status);

-- On-call activations indexes
CREATE INDEX IF NOT EXISTS idx_on_call_activations_assignment ON public.on_call_activations (assignment_id);
CREATE INDEX IF NOT EXISTS idx_on_call_activations_times ON public.on_call_activations (activation_time, deactivation_time);

-- Holidays indexes
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_individual_shifts_employee_date ON individual_shifts(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_individual_shifts_schedule_period ON individual_shifts(schedule_period_id);
CREATE INDEX IF NOT EXISTS idx_shift_pattern_rules_employee ON shift_pattern_rules(employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_pattern_rules_dates ON shift_pattern_rules(start_date, end_date);

-- --- Triggers and Constraints (including validation functions) ---

-- updated_at triggers
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shift_options_updated_at
    BEFORE UPDATE ON public.shift_options
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_periods_updated_at
    BEFORE UPDATE ON public.schedule_periods
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staffing_requirements_updated_at
    BEFORE UPDATE ON public.staffing_requirements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON public.schedules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_off_requests_updated_at
    BEFORE UPDATE ON public.time_off_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shift_swap_requests_updated_at
    BEFORE UPDATE ON public.shift_swap_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_on_call_assignments_updated_at
    BEFORE UPDATE ON public.on_call_assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_on_call_activations_updated_at
    BEFORE UPDATE ON public.on_call_activations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- created_by and updated_by triggers
CREATE TRIGGER set_created_by_employees
    BEFORE INSERT ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by();

CREATE TRIGGER update_employees_updated_by
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER set_created_by_shift_options
    BEFORE INSERT ON public.shift_options
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by();

CREATE TRIGGER update_shift_options_updated_by
    BEFORE UPDATE ON public.shift_options
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER set_created_by_schedules
    BEFORE INSERT ON public.schedules
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by();

CREATE TRIGGER update_schedules_updated_by
    BEFORE UPDATE ON public.schedules
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER set_created_by_time_off_requests
    BEFORE INSERT ON public.time_off_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by();

CREATE TRIGGER update_time_off_requests_updated_by
    BEFORE UPDATE ON public.time_off_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER set_created_by_shift_swap_requests
    BEFORE INSERT ON public.shift_swap_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by();

CREATE TRIGGER update_shift_swap_requests_updated_by
    BEFORE UPDATE ON public.shift_swap_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER set_created_by_on_call_assignments
    BEFORE INSERT ON public.on_call_assignments
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by();

CREATE TRIGGER update_on_call_assignments_updated_by
    BEFORE UPDATE ON public.on_call_assignments
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER set_created_by_on_call_activations
    BEFORE INSERT ON public.on_call_activations
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by();

CREATE TRIGGER update_on_call_activations_updated_by
    BEFORE UPDATE ON public.on_call_activations
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_by();
    
-- Create function to validate shift pattern
CREATE OR REPLACE FUNCTION public.validate_shift_pattern()
RETURNS trigger AS $$
DECLARE
    employee_pattern shift_pattern;
    shift_duration integer;
BEGIN
    -- Get employee's shift pattern
    SELECT shift_pattern INTO employee_pattern
    FROM public.employees
    WHERE id = NEW.employee_id;

    -- Get shift duration
    SELECT duration_hours INTO shift_duration
    FROM public.shift_options
    WHERE id = NEW.shift_option_id;

    -- Validate based on pattern
    CASE employee_pattern
        WHEN '4_10' THEN
            IF shift_duration != 10 THEN
                RAISE EXCEPTION 'Employee with 4x10 pattern can only be assigned 10-hour shifts';
            END IF;
        WHEN '3_12_4' THEN
            IF shift_duration NOT IN (12, 4) THEN
                RAISE EXCEPTION 'Employee with 3x12+4 pattern can only be assigned 12-hour or 4-hour shifts';
            END IF;
        WHEN 'CUSTOM' THEN
            -- Custom patterns allow any shift duration
            RETURN NEW;
        ELSE
            RAISE EXCEPTION 'Unknown shift pattern: %', employee_pattern;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for shift pattern validation
CREATE TRIGGER validate_shift_pattern_trigger
    BEFORE INSERT OR UPDATE ON public.schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_shift_pattern();

-- Create function to check for overlapping shifts
CREATE OR REPLACE FUNCTION public.check_overlapping_shifts()
RETURNS trigger AS $$
DECLARE
    shift_start_time time;
    shift_end_time time;
    existing_overlap boolean;
BEGIN
    -- Get shift times
    SELECT start_time, end_time INTO shift_start_time, shift_end_time
    FROM public.shift_options
    WHERE id = NEW.shift_option_id;

    -- Check for overlaps
    SELECT EXISTS (
        SELECT 1
        FROM public.schedules s
        JOIN public.shift_options so ON so.id = s.shift_option_id
        WHERE s.employee_id = NEW.employee_id
        AND s.date = NEW.date
        AND s.id != NEW.id  -- Exclude the current shift
        AND s.status != 'cancelled'
        AND (
            -- Convert to timestamp for proper midnight crossing comparison
            tstzrange(
                s.date + so.start_time::time,
                CASE
                    WHEN so.end_time < so.start_time THEN s.date + interval '1 day' + so.end_time::time
                    ELSE s.date + so.end_time::time
                END
            ) && tstzrange(  -- Use && operator for range overlap check
                NEW.date + shift_start_time::time,
                CASE
                    WHEN shift_end_time < shift_start_time THEN NEW.date + interval '1 day' + shift_end_time::time
                    ELSE NEW.date + shift_end_time::time
                END
            )
        )
    ) INTO existing_overlap;

    IF existing_overlap THEN
        RAISE EXCEPTION 'Shift overlaps with existing shift for employee';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for overlapping shifts check
CREATE TRIGGER check_overlapping_shifts_trigger
    BEFORE INSERT OR UPDATE ON public.schedules
    FOR EACH ROW
    WHEN (NEW.status != 'cancelled')
    EXECUTE FUNCTION public.check_overlapping_shifts();

-- Create function to check for overlapping time off requests
CREATE OR REPLACE FUNCTION public.check_overlapping_time_off()
RETURNS trigger AS $$
DECLARE
    existing_overlap boolean;
BEGIN
    -- Check for overlaps
    SELECT EXISTS (
        SELECT 1
        FROM public.time_off_requests t
        WHERE t.employee_id = NEW.employee_id
        AND t.id != NEW.id
        AND (t.status = 'approved' OR t.status = 'pending')
        AND daterange(t.start_date, t.end_date + 1, '[]') && daterange(NEW.start_date, NEW.end_date + 1, '[]')  -- Use && for range overlap
    ) INTO existing_overlap;

    IF existing_overlap THEN
        RAISE EXCEPTION 'Time off request overlaps with existing request';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for overlapping time off check
CREATE TRIGGER check_overlapping_time_off_trigger
    BEFORE INSERT OR UPDATE ON public.time_off_requests
    FOR EACH ROW
    WHEN (NEW.status = 'approved' OR NEW.status = 'pending')
    EXECUTE FUNCTION public.check_overlapping_time_off();

-- Create function to check for weekly hours
CREATE OR REPLACE FUNCTION public.check_weekly_hours()
RETURNS trigger AS $$
DECLARE
    total_hours decimal;
    max_hours integer;
BEGIN
    -- Get employee's weekly hours cap
    SELECT weekly_hours_cap INTO max_hours
    FROM public.employees
    WHERE id = NEW.employee_id;

    -- Calculate total hours for the week
    SELECT COALESCE(SUM(
        CASE
            WHEN s.actual_hours_worked IS NOT NULL THEN s.actual_hours_worked
            ELSE so.duration_hours
        END
    ), 0) INTO total_hours
    FROM public.schedules s
    JOIN public.shift_options so ON so.id = s.shift_option_id
    WHERE s.employee_id = NEW.employee_id
    AND s.date >= date_trunc('week', NEW.date)  -- Start of the week
    AND s.date < date_trunc('week', NEW.date) + interval '7 days' -- End of the week
    AND s.id != NEW.id  -- Exclude current shift being inserted/updated
    AND s.status != 'cancelled';

    -- Add hours from new shift
    SELECT total_hours + duration_hours INTO total_hours
    FROM public.shift_options
    WHERE id = NEW.shift_option_id;

    -- Check if total hours exceed cap (unless overtime is approved)
    IF total_hours > max_hours AND NOT NEW.overtime_approved THEN
        RAISE EXCEPTION 'Weekly hours (%) would exceed cap (%) for employee', total_hours, max_hours;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for weekly hours check
CREATE TRIGGER check_weekly_hours_trigger
    BEFORE INSERT OR UPDATE ON public.schedules
    FOR EACH ROW
    WHEN (NEW.status != 'cancelled')
    EXECUTE FUNCTION public.check_weekly_hours();

-- Create function to check for consecutive shifts
CREATE OR REPLACE FUNCTION public.check_consecutive_shifts()
RETURNS trigger AS $$
DECLARE
    pattern shift_pattern;
    consecutive_days integer;
    shift_count integer;
    last_shift_date date;
BEGIN
    -- Get employee's shift pattern
    SELECT shift_pattern INTO pattern
    FROM public.employees
    WHERE id = NEW.employee_id;

    -- Get the last shift date *before* this one
    SELECT date INTO last_shift_date
    FROM public.schedules
    WHERE employee_id = NEW.employee_id
    AND date < NEW.date
    AND status != 'cancelled'
    ORDER BY date DESC
    LIMIT 1;

    -- Count consecutive days up to *this* shift.
    SELECT COUNT(*) INTO consecutive_days
        FROM (
            SELECT DISTINCT date
            FROM public.schedules
            WHERE employee_id = NEW.employee_id
            AND date <= NEW.date
            AND date > NEW.date - interval '7 days'  -- Check up to 7 days back
            AND status != 'cancelled'
            ORDER BY date DESC
    ) dates;


     -- Count shifts in the current consecutive period
    SELECT COUNT(*) INTO shift_count
    FROM public.schedules s
    WHERE s.employee_id = NEW.employee_id
    AND s.date > COALESCE(last_shift_date, NEW.date - interval '7 days') -- Count from the last shift or 7 days ago
    AND s.date <= NEW.date
    AND s.status != 'cancelled';

    -- Validate based on pattern
    CASE pattern
        WHEN '4_10' THEN
            IF shift_count >= 4  AND NEW.date - last_shift_date <= 4  THEN
                RAISE EXCEPTION '4_10 allows maximum 4 consecutive shifts';
            END IF;
        WHEN '3_12_4' THEN
            -- Count shifts by duration
              IF EXISTS (
                SELECT 1
                FROM (
                    SELECT so.duration_hours
                    FROM public.schedules s
                    JOIN public.shift_options so ON so.id = s.shift_option_id
                    WHERE s.employee_id = NEW.employee_id
                    AND s.date > COALESCE(last_shift_date, NEW.date - interval '7 days')
                    AND s.date <= NEW.date
                    AND s.status != 'cancelled'
                    GROUP BY so.duration_hours
                    HAVING
                        (duration_hours = 12 AND COUNT(*) > 3)
                        OR (duration_hours = 4 AND COUNT(*) >1)
                ) shift_counts
            ) THEN
                 RAISE EXCEPTION '3_12_4 allows maximum 3 12-hour shifts and 1 4-hour shift';
            END IF;
        ELSE
            -- For CUSTOM pattern or any other patterns, apply a default maximum of 7 consecutive days
            IF consecutive_days > 7 THEN
                RAISE EXCEPTION 'Maximum 7 consecutive days allowed for custom patterns';
            END IF;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for consecutive shifts check
CREATE TRIGGER check_consecutive_shifts_trigger
    BEFORE INSERT OR UPDATE ON public.schedules
    FOR EACH ROW
    WHEN (NEW.status != 'cancelled')
    EXECUTE FUNCTION public.check_consecutive_shifts();

-- --- Audit Log ---

-- Create Audit Log Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    operation text NOT NULL,  -- INSERT, UPDATE, DELETE
    old_data jsonb,
    new_data jsonb,
    changed_by uuid REFERENCES auth.users(id),
    changed_at timestamptz NOT NULL DEFAULT now()
);

-- Create Audit Trigger Function
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        changed_by
    )
    VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),  -- Use the ID of the new or old record
        TG_OP,  -- Operation type (INSERT, UPDATE, DELETE)
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('UPDATE', 'INSERT') THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid()  -- Log the user who made the change
    );
    RETURN NULL; -- Return value is ignored for AFTER triggers
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add Audit Triggers for relevant tables
CREATE TRIGGER audit_employees_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Continue Audit Triggers
CREATE TRIGGER audit_schedules_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.schedules
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER audit_staffing_requirements_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.staffing_requirements
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER audit_time_off_requests_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.time_off_requests
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER audit_shift_swap_requests_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.shift_swap_requests
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER audit_on_call_assignments_trigger
   AFTER INSERT OR UPDATE OR DELETE ON public.on_call_assignments
   FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER audit_on_call_activations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.on_call_activations
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER audit_shift_options_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.shift_options
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER audit_schedule_periods_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.schedule_periods
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- --- Row Level Security ---

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staffing_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.on_call_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.on_call_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY; -- Enable RLS on audit_logs

-- RLS Policies for Employees
CREATE POLICY employees_select_own ON public.employees
    FOR SELECT
    USING (auth_id = auth.uid());

CREATE POLICY employees_select_supervisor ON public.employees
    FOR SELECT
    USING (is_supervisor_or_above() AND id IN (SELECT employee_id FROM public.get_team_members()));

CREATE POLICY employees_all_manager ON public.employees
    FOR ALL
    USING (is_manager());

-- RLS Policies for Shift Options (Reference Data)
CREATE POLICY shift_options_read_authenticated ON public.shift_options
    FOR SELECT
    USING (true);

CREATE POLICY shift_options_all_manager ON public.shift_options
    FOR ALL
    USING (is_manager());

-- RLS Policies for Schedule Periods
CREATE POLICY schedule_periods_read_authenticated ON public.schedule_periods
    FOR SELECT
    USING (true);

CREATE POLICY schedule_periods_all_manager ON public.schedule_periods
    FOR ALL
    USING (is_manager());

-- RLS Policies for Staffing Requirements
CREATE POLICY staffing_requirements_read_authenticated ON public.staffing_requirements
    FOR SELECT
    USING (true);

CREATE POLICY staffing_requirements_all_manager ON public.staffing_requirements
    FOR ALL
    USING (is_manager());

-- RLS Policies for Schedules
CREATE POLICY schedules_select_own ON public.schedules
    FOR SELECT
    USING (employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid()));

CREATE POLICY schedules_select_supervisor ON public.schedules
    FOR SELECT
    USING (is_supervisor_or_above() AND employee_id IN (SELECT employee_id FROM public.get_team_members()));

CREATE POLICY schedules_update_supervisor ON public.schedules
    FOR UPDATE
    USING (is_supervisor_or_above() AND employee_id IN (SELECT employee_id FROM public.get_team_members()));

CREATE POLICY schedules_all_manager ON public.schedules
    FOR ALL
    USING (is_manager());
    
CREATE POLICY schedules_update_own ON public.schedules
    FOR UPDATE
    USING (
        employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid())
    )
    WITH CHECK (
        employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid()) AND
        EXISTS (
            SELECT 1
            FROM public.schedules old_schedule
            WHERE old_schedule.id = schedules.id
            AND (
                -- Only allow updating actual times and break times and notes
                (old_schedule.actual_start_time IS DISTINCT FROM schedules.actual_start_time) OR
                (old_schedule.actual_end_time IS DISTINCT FROM schedules.actual_end_time) OR
                (old_schedule.break_start_time IS DISTINCT FROM schedules.break_start_time) OR
                (old_schedule.break_end_time IS DISTINCT FROM schedules.break_end_time) OR
                (old_schedule.notes IS DISTINCT FROM schedules.notes)
            )
        )
    );

-- RLS Policies for Time Off Requests
CREATE POLICY time_off_select_own ON public.time_off_requests
    FOR SELECT
    USING (employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid()));

CREATE POLICY time_off_insert_own ON public.time_off_requests
    FOR INSERT
    WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid()));

CREATE POLICY time_off_update_own ON public.time_off_requests
    FOR UPDATE
    USING (
        employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid()) AND
        status = 'pending'
    );

CREATE POLICY time_off_delete_own ON public.time_off_requests
    FOR DELETE
    USING (
        employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid()) AND
        status = 'pending'
    );

CREATE POLICY time_off_select_supervisor ON public.time_off_requests
    FOR SELECT
    USING (is_supervisor_or_above() AND employee_id IN (SELECT employee_id FROM public.get_team_members()));
    
CREATE POLICY time_off_update_supervisor ON public.time_off_requests
    FOR UPDATE
    USING (
        is_supervisor_or_above() AND
        employee_id IN (SELECT employee_id FROM public.get_team_members())
    )
    WITH CHECK (
        is_supervisor_or_above() AND
        employee_id IN (SELECT employee_id FROM public.get_team_members()) AND
        EXISTS (
            SELECT 1
            FROM public.time_off_requests old_request
            WHERE old_request.id = time_off_requests.id
            AND (
                -- Only allow updating status, reviewed_by, reviewed_at and notes.  The employee, dates and reason cannot be changed.
                old_request.status IS DISTINCT FROM time_off_requests.status AND
                old_request.employee_id = time_off_requests.employee_id AND
                old_request.start_date = time_off_requests.start_date AND
                old_request.end_date = time_off_requests.end_date AND
                old_request.reason = time_off_requests.reason
            )
        )
    );

CREATE POLICY time_off_all_manager ON public.time_off_requests
    FOR ALL
    USING (is_manager());

-- RLS Policies for Shift Swap Requests
CREATE POLICY "Employees can create swap requests" ON public.shift_swap_requests
    FOR INSERT WITH CHECK (
        requesting_employee_id IN (
            SELECT id FROM public.employees WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Employees can view own swap requests" ON public.shift_swap_requests
    FOR SELECT USING (
        requesting_employee_id IN (
            SELECT id FROM public.employees WHERE auth_id = auth.uid()
        )
        OR receiving_employee_id IN (
            SELECT id FROM public.employees WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Supervisors can view team swap requests" ON public.shift_swap_requests
    FOR SELECT USING (
        is_supervisor_or_above()
        AND (
            requesting_employee_id IN (SELECT employee_id FROM public.get_team_members())
            OR receiving_employee_id IN (SELECT employee_id FROM public.get_team_members())
        )
    );
CREATE POLICY "Supervisors can update team swap requests" ON public.shift_swap_requests
    FOR UPDATE USING (
        is_supervisor_or_above()
        AND status = 'pending'
        AND (
            requesting_employee_id IN (SELECT employee_id FROM public.get_team_members())
            OR receiving_employee_id IN (SELECT employee_id FROM public.get_team_members())
        )
    )
    WITH CHECK (
        is_supervisor_or_above()
        AND status IN ('approved', 'rejected')
    );

CREATE POLICY "Managers can manage all swap requests" ON public.shift_swap_requests
    FOR ALL USING (is_manager());

-- On-Call Assignments policies
CREATE POLICY "Employees can view own on-call assignments" ON public.on_call_assignments
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM public.employees WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Supervisors can view team on-call assignments" ON public.on_call_assignments
    FOR SELECT USING (
        is_supervisor_or_above()
        AND employee_id IN (SELECT employee_id FROM public.get_team_members())
    );

CREATE POLICY "Managers can manage all on-call assignments" ON public.on_call_assignments
    FOR ALL USING (is_manager());

-- On-Call Activations policies
CREATE POLICY "Employees can view own activations" ON public.on_call_activations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.on_call_assignments oca
            WHERE oca.id = assignment_id
            AND oca.employee_id IN (
                SELECT id FROM public.employees WHERE auth_id = auth.uid()
            )
        )
    );

CREATE POLICY "Supervisors can view team activations" ON public.on_call_activations
    FOR SELECT USING (
        is_supervisor_or_above()
        AND EXISTS (
            SELECT 1 FROM public.on_call_assignments oca
            WHERE oca.id = assignment_id
            AND oca.employee_id IN (SELECT employee_id FROM public.get_team_members())
        )
    );

CREATE POLICY "Managers can manage all activations" ON public.on_call_activations
    FOR ALL USING (is_manager());

-- RLS Policies for Audit Logs
CREATE POLICY audit_logs_select_own ON public.audit_logs
    FOR SELECT
    USING (
        record_id IN (
            SELECT id FROM public.employees WHERE auth_id = auth.uid()
            UNION
            SELECT id FROM public.schedules WHERE employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid())
            UNION
            SELECT id FROM public.time_off_requests WHERE employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid())
        )
    );

CREATE POLICY audit_logs_select_supervisor ON public.audit_logs
    FOR SELECT
    USING (
        is_supervisor_or_above() AND
        record_id IN (
            SELECT id FROM public.employees WHERE id IN (SELECT employee_id FROM public.get_team_members())
            UNION
            SELECT id FROM public.schedules WHERE employee_id IN (SELECT employee_id FROM public.get_team_members())
            UNION
            SELECT id FROM public.time_off_requests WHERE employee_id IN (SELECT employee_id FROM public.get_team_members())
        )
    );

CREATE POLICY audit_logs_all_manager ON public.audit_logs
    FOR ALL
    USING (is_manager());

-- --- Reporting Views ---

-- Overtime Report View
CREATE OR REPLACE VIEW public.overtime_report AS
SELECT
    e.id as employee_id,
    e.first_name || ' ' || e.last_name as employee_name,
    s.date,
    s.actual_hours_worked,
    CASE
        WHEN s.actual_hours_worked > so.duration_hours THEN s.actual_hours_worked - so.duration_hours
        ELSE 0
    END as overtime_hours,
    s.overtime_approved,
    s.overtime_approved_by,
    s.overtime_approved_at
FROM
    public.schedules s
    JOIN public.employees e ON s.employee_id = e.id
    JOIN public.shift_options so ON s.shift_option_id = so.id
WHERE
    s.actual_hours_worked IS NOT NULL
    AND s.actual_hours_worked > so.duration_hours;

-- Staffing Level Report View
CREATE OR REPLACE VIEW public.staffing_level_report AS
SELECT
    sr.id as requirement_id,
    sr.schedule_period_id,
    sr.time_block_start,
    sr.time_block_end,
    sr.min_total_staff,
    sr.min_supervisors,
    s.date,
    COUNT(DISTINCT s.id) as actual_staff_count,
    COUNT(DISTINCT CASE WHEN e.role = 'supervisor' THEN s.id END) as actual_supervisor_count,
    CASE
        WHEN COUNT(DISTINCT s.id) < sr.min_total_staff THEN true
        ELSE false
    END as is_understaffed,
    CASE
        WHEN COUNT(DISTINCT CASE WHEN e.role = 'supervisor' THEN s.id END) < sr.min_supervisors THEN true
        ELSE false
    END as missing_supervisors
FROM
    public.staffing_requirements sr
    CROSS JOIN (
        SELECT DISTINCT date
        FROM public.schedules
    ) dates(date)  -- Generate all dates from schedule periods
    LEFT JOIN public.schedules s ON s.date = dates.date
    LEFT JOIN public.shift_options so ON s.shift_option_id = so.id
    LEFT JOIN public.employees e ON s.employee_id = e.id
WHERE
     s.status = 'scheduled'
    AND (
        so.start_time BETWEEN sr.time_block_start AND sr.time_block_end
        OR so.end_time BETWEEN sr.time_block_start AND sr.time_block_end
        -- Handle shifts crossing midnight
         OR (sr.time_block_start > sr.time_block_end AND (so.start_time >= sr.time_block_start OR so.end_time <= sr.time_block_end))
    )
 AND dates.date BETWEEN (SELECT start_date FROM public.schedule_periods WHERE id = sr.schedule_period_id)
    AND (SELECT end_date FROM public.schedule_periods WHERE id = sr.schedule_period_id)
GROUP BY
    sr.id,
    sr.schedule_period_id,
    sr.time_block_start,
    sr.time_block_end,
    sr.min_total_staff,
    sr.min_supervisors,
    s.date;

    -- Reporting Views (Continued. Already included in the previous response, but adding here for completeness within *this* section)

-- --- Final Cleanup and Verification ---

-- Add index on audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON public.audit_logs (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON public.audit_logs (changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON public.audit_logs (changed_at DESC);

-- Verify that all functions are marked as SECURITY DEFINER where appropriate
-- (This is already done in the previous sections, but it's a good practice to double-check)

-- You may want to create some initial data (e.g., a manager user) after running this migration.
-- Example: INSERT INTO public.employees (auth_id, first_name, last_name, email, role, shift_pattern) VALUES (...);

-- The migration is now complete.

-- Grant permissions for auth schema and its objects
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres, service_role;

CREATE INDEX IF NOT EXISTS refresh_tokens_token_idx ON auth.refresh_tokens USING btree (token);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON auth.refresh_tokens USING btree (user_id);
set check_function_bodies = off;
CREATE OR REPLACE FUNCTION auth.create_dispatcher_user(user_id uuid, email text, password text, role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'auth', 'public', 'extensions'
AS $function$
DECLARE
    _encrypted_password TEXT;
BEGIN
    -- Use auth schema's password hashing
    _encrypted_password := auth.hash_password(password);
    
    -- Create user in auth schema
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        role,
        confirmation_token,
        aud
    )
    VALUES (
        user_id,
        '00000000-0000-0000-0000-000000000000',
        email,
        _encrypted_password,
        NOW(),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
        jsonb_build_object('role', role),
        NOW(),
        NOW(),
        role,
        encode(gen_random_bytes(32), 'base64'),
        'authenticated'
    );

    -- Create identity
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        created_at,
        updated_at,
        last_sign_in_at
    )
    VALUES (
        user_id,
        user_id,
        jsonb_build_object(
            'sub', user_id::text,
            'email', email,
            'email_verified', true
        ),
        'email',
        email,
        NOW(),
        NOW(),
        NOW()
    );

    -- Create refresh token
    INSERT INTO auth.refresh_tokens (
        instance_id,
        user_id,
        token,
        created_at,
        updated_at,
        parent,
        revoked
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        user_id,
        encode(gen_random_bytes(48), 'base64'),
        NOW(),
        NOW(),
        NULL,
        false
    );
END;
$function$;
CREATE OR REPLACE FUNCTION auth.hash_password(password text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN extensions.crypt(password, extensions.gen_salt('bf', 10));
END;
$function$;

-- Function to confirm users (development only)
CREATE OR REPLACE FUNCTION auth.confirm_user(user_id uuid, email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
    -- Only allow this in development
    IF current_setting('app.settings.environment', TRUE) != 'development' THEN
        RAISE EXCEPTION 'This function can only be used in development';
    END IF;

    -- Update the user's email_confirmed_at
    UPDATE auth.users
    SET email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = user_id
    AND email = email
    AND email_confirmed_at IS NULL;
END;
$$;

-- Grant execute permission on the confirm_user function
GRANT EXECUTE ON FUNCTION auth.confirm_user TO authenticated;
GRANT EXECUTE ON FUNCTION auth.confirm_user TO service_role;

-- Function to confirm emails (development only)
CREATE OR REPLACE FUNCTION auth.confirm_email(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
    -- Only allow this in development
    IF current_setting('app.settings.environment', TRUE) != 'development' THEN
        RAISE EXCEPTION 'This function can only be used in development';
    END IF;

    -- Update the user's email_confirmed_at
    UPDATE auth.users
    SET email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = user_id
    AND email_confirmed_at IS NULL;
END;
$$;

-- Grant execute permission on the confirm_email function
GRANT EXECUTE ON FUNCTION auth.confirm_email TO authenticated;
GRANT EXECUTE ON FUNCTION auth.confirm_email TO service_role;

-- Grant permissions on types
GRANT USAGE ON TYPE public.employee_role TO authenticated;
GRANT USAGE ON TYPE public.shift_pattern TO authenticated;
GRANT USAGE ON TYPE public.shift_category TO authenticated;
GRANT USAGE ON TYPE public.time_off_status TO authenticated;
GRANT USAGE ON TYPE public.shift_status TO authenticated;
GRANT USAGE ON TYPE public.swap_request_status TO authenticated;
GRANT USAGE ON TYPE public.on_call_status TO authenticated;
GRANT USAGE ON TYPE holiday_type TO authenticated;
GRANT USAGE ON TYPE schedule_status TO authenticated;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_supervisor_or_above() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_members() TO authenticated;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Create rate_limits table for tracking API rate limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id text PRIMARY KEY,
    count integer NOT NULL DEFAULT 1,
    last_request timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT valid_count CHECK (count >= 0)
);

-- Add RLS policies
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
GRANT ALL ON TABLE public.rate_limits TO authenticated;
GRANT ALL ON TABLE public.rate_limits TO service_role;

-- Add updated_at trigger
CREATE TRIGGER update_rate_limits_updated_at
    BEFORE UPDATE ON public.rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits() RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS $$
BEGIN
    -- Delete rate limit entries older than 1 hour
    DELETE FROM public.rate_limits
    WHERE updated_at < (CURRENT_TIMESTAMP - INTERVAL '1 hour');
END;
$$;

-- Create a scheduled job to cleanup old rate limit entries
SELECT cron.schedule(
    'cleanup-rate-limits',
    '*/10 * * * *', -- Run every 10 minutes
    $$SELECT public.cleanup_rate_limits()$$
); 

-- Enable JWT authentication and verification
create extension if not exists "pgjwt" with schema extensions;

-- Configure auth settings
alter table auth.users enable row level security;

-- Set up RLS policies for users
create policy "Users can view own data"
  on auth.users
  for select
  using (auth.uid()::uuid = id);

-- Configure JWT claims
create or replace function auth.jwt() returns jsonb as $$
begin
  return jsonb_build_object(
    'role', current_user,
    'aud', 'authenticated',
    'exp', extract(epoch from (now() + interval '7 days'))::integer,
    'sub', auth.uid()::text,
    'email', (select email from auth.users where id = auth.uid()::uuid),
    'app_metadata', (
      select jsonb_build_object(
        'provider', provider,
        'providers', array_agg(provider)
      )
      from auth.identities
      where user_id = auth.uid()::uuid
      group by provider
    ),
    'user_metadata', (
      select raw_user_meta_data
      from auth.users
      where id = auth.uid()::uuid
    )
  );
end;
$$ language plpgsql security definer;

-- Set up RLS policies for auth tables
alter table auth.refresh_tokens enable row level security;
alter table auth.sessions enable row level security;
alter table auth.mfa_factors enable row level security;
alter table auth.mfa_amr_claims enable row level security;
alter table auth.mfa_challenges enable row level security;

-- Create RLS policies for auth tables
create policy "Users can manage own refresh tokens"
  on auth.refresh_tokens
  for all
  using (auth.uid()::text = user_id);

create policy "Users can manage own sessions"
  on auth.sessions
  for all
  using (auth.uid()::uuid = user_id);

create policy "Users can view own mfa factors"
  on auth.mfa_factors
  for select
  using (auth.uid()::uuid = user_id);

create policy "Users can manage own mfa factors"
  on auth.mfa_factors
  for all
  using (auth.uid()::uuid = user_id);

-- MFA AMR claims policy using session join
create policy "Users can view own amr claims"
  on auth.mfa_amr_claims
  for select
  using (
    EXISTS (
      SELECT 1
      FROM auth.sessions
      WHERE sessions.id = mfa_amr_claims.session_id
      AND sessions.user_id = auth.uid()::uuid
    )
  );

create policy "Users can manage own amr claims"
  on auth.mfa_amr_claims
  for all
  using (
    EXISTS (
      SELECT 1
      FROM auth.sessions
      WHERE sessions.id = mfa_amr_claims.session_id
      AND sessions.user_id = auth.uid()::uuid
    )
  );

-- MFA challenges policy using session join
create policy "Users can view own challenges"
  on auth.mfa_challenges
  for select
  using (
    EXISTS (
      SELECT 1
      FROM auth.mfa_factors
      WHERE mfa_factors.id = mfa_challenges.factor_id
      AND mfa_factors.user_id = auth.uid()::uuid
    )
  );

create policy "Users can manage own challenges"
  on auth.mfa_challenges
  for all
  using (
    EXISTS (
      SELECT 1
      FROM auth.mfa_factors
      WHERE mfa_factors.id = mfa_challenges.factor_id
      AND mfa_factors.user_id = auth.uid()::uuid
    )
  );

-- Set up audit logging
create table if not exists auth.audit_log_entries (
  instance_id uuid,
  id uuid not null,
  payload json,
  created_at timestamptz,
  ip_address varchar(64)
);

create index if not exists audit_logs_instance_id_idx on auth.audit_log_entries (instance_id);
create index if not exists audit_logs_id_idx on auth.audit_log_entries (id);
create index if not exists audit_logs_created_at_idx on auth.audit_log_entries (created_at);

-- Configure rate limiting
create table if not exists auth.rate_limits (
  id bigserial primary key,
  entity_id uuid not null,
  entity_type text not null,
  action text not null,
  attempts int not null default 0,
  last_attempted_at timestamptz not null default now(),
  blocked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists rate_limits_entity_action_idx 
  on auth.rate_limits (entity_id, entity_type, action);

create index if not exists rate_limits_blocked_until_idx 
  on auth.rate_limits (blocked_until);

-- Function to check rate limits
create or replace function auth.check_rate_limit(
  p_entity_id uuid,
  p_entity_type text,
  p_action text,
  p_max_attempts int,
  p_window interval,
  p_block_duration interval
) returns boolean as $$
declare
  v_rate_limit auth.rate_limits%rowtype;
begin
  -- Get or create rate limit record
  insert into auth.rate_limits (entity_id, entity_type, action)
  values (p_entity_id, p_entity_type, p_action)
  on conflict (entity_id, entity_type, action) do update
  set attempts = case
    when auth.rate_limits.last_attempted_at < now() - p_window then 1
    else auth.rate_limits.attempts + 1
    end,
    last_attempted_at = now(),
    blocked_until = case
    when auth.rate_limits.last_attempted_at < now() - p_window then null
    when auth.rate_limits.attempts + 1 >= p_max_attempts then now() + p_block_duration
    else auth.rate_limits.blocked_until
    end
  returning * into v_rate_limit;

  -- Check if blocked
  if v_rate_limit.blocked_until is not null and v_rate_limit.blocked_until > now() then
    return false;
  end if;

  -- Check attempts within window
  if v_rate_limit.attempts >= p_max_attempts and 
     v_rate_limit.last_attempted_at > now() - p_window then
    return false;
  end if;

  return true;
end;
$$ language plpgsql security definer;

-- Drop existing employee-related policies
DROP POLICY IF EXISTS "Users can view own employee data" ON public.employees;
DROP POLICY IF EXISTS "Managers can view all employee data" ON public.employees;
DROP POLICY IF EXISTS "Users can update own employee data" ON public.employees;
DROP POLICY IF EXISTS "Managers can update all employee data" ON public.employees;

-- Recreate employee policies with proper UUID casting
CREATE POLICY "Users can view own employee data"
  ON public.employees
  FOR SELECT
  USING (auth_id = auth.uid()::uuid OR public.is_supervisor_or_above());

CREATE POLICY "Managers can view all employee data"
  ON public.employees
  FOR SELECT
  USING (public.is_manager());

CREATE POLICY "Users can update own employee data"
  ON public.employees
  FOR UPDATE
  USING (auth_id = auth.uid()::uuid);

CREATE POLICY "Managers can update all employee data"
  ON public.employees
  FOR UPDATE
  USING (public.is_manager());

-- Add trigger for handling new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.employees (auth_id, email, first_name, last_name, role, shift_pattern)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    (COALESCE(NEW.raw_user_meta_data->>'role', 'dispatcher'))::public.employee_role,
    (COALESCE(NEW.raw_user_meta_data->>'shift_pattern', '4_10'))::public.shift_pattern
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user(); 