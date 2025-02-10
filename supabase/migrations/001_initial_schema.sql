-- 001_initial_schema.sql
--
-- This migration sets up the initial schema, including:
--  - Extensions
--  - Enums
--  - Core tables (employees, profiles, shift_options, etc.)
--  - Essential triggers for updated_at columns

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Enum Types
DO $$ BEGIN
    CREATE TYPE public.employee_role AS ENUM ('dispatcher', 'supervisor', 'manager');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.shift_pattern AS ENUM ('pattern_a', 'pattern_b', 'custom');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.shift_category AS ENUM ('early', 'day', 'swing', 'graveyard');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.time_off_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.shift_status AS ENUM (
        'scheduled',
        'in_progress',
        'completed',
        'missed',
        'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.log_severity AS ENUM ('info', 'warning', 'error');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.swap_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Core Tables
DO $$ BEGIN
    CREATE TABLE IF NOT EXISTS auth.users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        instance_id uuid,
        aud character varying(255),
        role character varying(255),
        email character varying(255),
        encrypted_password character varying(255),
        email_confirmed_at timestamptz,
        invited_at timestamptz,
        confirmation_token character varying(255),
        confirmation_sent_at timestamptz,
        recovery_token character varying(255),
        recovery_sent_at timestamptz,
        email_change_token_new character varying(255),
        email_change character varying(255),
        email_change_sent_at timestamptz,
        last_sign_in_at timestamptz,
        raw_app_meta_data jsonb,
        raw_user_meta_data jsonb,
        is_super_admin boolean,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        phone text DEFAULT NULL,
        phone_confirmed_at timestamptz,
        phone_change text DEFAULT '',
        phone_change_token character varying(255) DEFAULT '',
        phone_change_sent_at timestamptz,
        confirmed_at timestamptz,
        email_change_token_current character varying(255) DEFAULT '',
        email_change_confirm_status smallint DEFAULT 0,
        banned_until timestamptz,
        reauthentication_token character varying(255) DEFAULT '',
        reauthentication_sent_at timestamptz,
        is_sso_user boolean DEFAULT false,
        deleted_at timestamptz,
        is_anonymous boolean DEFAULT false,
        factors integer DEFAULT 0
    );
EXCEPTION WHEN duplicate_table THEN
    -- Table already exists, do nothing
    NULL;
END $$;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL UNIQUE,
    role text NOT NULL,
    is_email_verified boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_role CHECK (role IN ('dispatcher', 'supervisor', 'manager'))
);

CREATE TABLE IF NOT EXISTS public.employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text UNIQUE NOT NULL,
    role public.employee_role NOT NULL,
    shift_pattern public.shift_pattern NOT NULL,
    preferred_shift_category public.shift_category,
    weekly_hours_cap integer NOT NULL DEFAULT 40,
    max_overtime_hours integer DEFAULT 0,
    last_shift_date date,
    total_hours_current_week integer DEFAULT 0,
    consecutive_shifts_count integer DEFAULT 0,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.shift_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    duration_hours integer NOT NULL,
    category public.shift_category NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_duration CHECK (duration_hours IN (4, 10, 12))
);

CREATE TABLE public.staffing_requirements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    time_block_start time NOT NULL,
    time_block_end time NOT NULL,
    min_total_staff integer NOT NULL,
    min_supervisors integer NOT NULL DEFAULT 1,
    schedule_period_id uuid,
    is_holiday boolean DEFAULT false,
    override_reason text,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.shift_pattern_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern public.shift_pattern NOT NULL,
    consecutive_shifts integer NOT NULL,
    shift_durations integer NOT NULL,
    min_rest_hours integer NOT NULL DEFAULT 10,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_consecutive_shifts CHECK (consecutive_shifts > 0),
    CONSTRAINT valid_min_rest CHECK (min_rest_hours >= 8)
);

CREATE TABLE public.schedule_periods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    start_date date NOT NULL,
    end_date date NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS public.individual_shifts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES public.employees(id),
    shift_option_id uuid NOT NULL REFERENCES public.shift_options(id),
    schedule_period_id uuid REFERENCES public.schedule_periods(id),
    date date NOT NULL,
    status public.shift_status NOT NULL DEFAULT 'scheduled',
    is_overtime boolean NOT NULL DEFAULT false,
    actual_start_time timestamptz,
    actual_end_time timestamptz,
    break_start_time timestamptz,
    break_end_time timestamptz,
    break_duration_minutes integer,
    actual_hours_worked decimal(5, 2),
    notes text,
    schedule_conflict_notes text,
    is_regular_schedule boolean NOT NULL DEFAULT true,
    supervisor_approved_by uuid REFERENCES public.employees(id),
    supervisor_approved_at timestamptz,
    shift_score integer,
    fatigue_level integer,
    requested_overtime boolean DEFAULT false,
    overtime_hours decimal(4, 2) DEFAULT 0,
    overtime_approved_by uuid REFERENCES public.employees(id),
    overtime_approved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_break_times CHECK (
        (
            break_start_time IS NULL
            AND break_end_time IS NULL
        )
        OR (
            break_start_time IS NOT NULL
            AND break_end_time IS NOT NULL
            AND break_start_time < break_end_time
        )
    ),
    CONSTRAINT valid_actual_times CHECK (
        (
            actual_start_time IS NULL
            AND actual_end_time IS NULL
        )
        OR (
            actual_start_time IS NOT NULL
            AND actual_end_time IS NOT NULL
            AND actual_start_time < actual_end_time
        )
    ),
    CONSTRAINT supervisor_approval_complete CHECK (
        (
            supervisor_approved_by IS NULL
            AND supervisor_approved_at IS NULL
        )
        OR (
            supervisor_approved_by IS NOT NULL
            AND supervisor_approved_at IS NOT NULL
        )
    ),
    CONSTRAINT overtime_approval_complete CHECK (
        (
            overtime_approved_by IS NULL
            AND overtime_approved_at IS NULL
        )
        OR (
            overtime_approved_by IS NOT NULL
            AND overtime_approved_at IS NOT NULL
        )
    ),
    CONSTRAINT valid_shift_hours CHECK (
        actual_hours_worked >= 0
        AND actual_hours_worked <= 24
    ),
    CONSTRAINT valid_break_duration CHECK (
        break_duration_minutes >= 0
        AND break_duration_minutes <= 60
    ),
    CONSTRAINT valid_overtime_hours CHECK (
        overtime_hours >= 0
        AND overtime_hours <= 8
    )
);

CREATE TABLE public.time_off_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES public.employees(id),
    start_date date NOT NULL,
    end_date date NOT NULL,
    status public.time_off_status NOT NULL DEFAULT 'pending',
    notes text,
    reason text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.shift_swap_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    requesting_shift_id uuid NOT NULL REFERENCES public.individual_shifts(id),
    target_shift_id uuid REFERENCES public.individual_shifts(id),
    requesting_employee_id uuid NOT NULL REFERENCES public.employees(id),
    target_employee_id uuid REFERENCES public.employees(id),
    reason text,
    status public.swap_request_status NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT different_employees CHECK (requesting_employee_id != target_employee_id)
);

CREATE TABLE public.scheduling_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_period_id uuid REFERENCES public.schedule_periods(id),
    timestamp timestamptz DEFAULT now(),
    log_message text NOT NULL,
    severity public.log_severity NOT NULL,
    related_employee_id uuid REFERENCES public.employees(id),
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.shift_assignment_scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES public.employees(id),
    shift_id uuid NOT NULL REFERENCES public.individual_shifts(id),
    schedule_period_id uuid NOT NULL REFERENCES public.schedule_periods(id),
    preference_score integer NOT NULL,
    fatigue_score integer NOT NULL,
    fairness_score integer NOT NULL,
    total_score integer NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT valid_scores CHECK (
        preference_score >= 0
        AND fatigue_score >= 0
        AND fairness_score >= 0
    )
);

CREATE TABLE public.schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES public.employees(id),
    schedule_period_id uuid NOT NULL REFERENCES public.schedule_periods(id),
    status text NOT NULL DEFAULT 'draft',
    is_published boolean NOT NULL DEFAULT false,
    published_at timestamptz,
    published_by uuid REFERENCES public.employees(id),
    total_hours integer NOT NULL DEFAULT 0,
    overtime_hours integer NOT NULL DEFAULT 0,
    notes text,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_hours CHECK (
        total_hours >= 0 
        AND overtime_hours >= 0
        AND overtime_hours <= total_hours
    ),
    CONSTRAINT valid_publish_state CHECK (
        (NOT is_published AND published_at IS NULL AND published_by IS NULL) OR
        (is_published AND published_at IS NOT NULL AND published_by IS NOT NULL)
    )
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.system_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key text UNIQUE NOT NULL,
    setting_value text NOT NULL,
    description text,
    is_encrypted boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Triggers for `updated_at` columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$ BEGIN
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN
    -- Trigger already exists, do nothing
    NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_shift_options_updated_at
    BEFORE UPDATE ON public.shift_options
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_staffing_requirements_updated_at
    BEFORE UPDATE ON public.staffing_requirements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_shift_pattern_rules_updated_at
    BEFORE UPDATE ON public.shift_pattern_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_schedule_periods_updated_at
    BEFORE UPDATE ON public.schedule_periods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_individual_shifts_updated_at
    BEFORE UPDATE ON public.individual_shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_time_off_requests_updated_at
    BEFORE UPDATE ON public.time_off_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_shift_swap_requests_updated_at
    BEFORE UPDATE ON public.shift_swap_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON public.schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;