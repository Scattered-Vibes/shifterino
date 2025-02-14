-- Create auth.users table first (as it's referenced by other tables)
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
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false
);

-- Create auth.instances table
CREATE TABLE IF NOT EXISTS auth.instances (
    id uuid NOT NULL PRIMARY KEY,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- Create auth.mfa_factors table first (as it's referenced by sessions)
CREATE TABLE IF NOT EXISTS auth.mfa_factors (
    id uuid NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    friendly_name text,
    factor_type auth.factor_type,
    status auth.factor_status,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    secret text
);

-- Create auth.sessions table (before refresh_tokens as it's referenced by it)
CREATE TABLE IF NOT EXISTS auth.sessions (
    id uuid NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level
);

-- Add foreign key constraint for sessions.factor_id
ALTER TABLE auth.sessions
ADD CONSTRAINT sessions_factor_id_fkey
FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id);

-- Create auth.refresh_tokens table (after sessions as it references it)
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    instance_id uuid,
    id bigserial PRIMARY KEY,
    token character varying(255),
    user_id uuid REFERENCES auth.users(id),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid REFERENCES auth.sessions(id) ON DELETE CASCADE
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

-- Create audit log table
CREATE TABLE IF NOT EXISTS auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL PRIMARY KEY,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying
);

-- Create public tables

-- Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    role public.employee_role NOT NULL,
    shift_pattern public.shift_pattern NOT NULL,
    preferred_shift_category public.shift_category NOT NULL,
    team_id uuid,
    weekly_hours_cap INTEGER DEFAULT 40 CHECK (weekly_hours_cap >= 0),
    max_overtime_hours INTEGER DEFAULT 0 CHECK (max_overtime_hours >= 0),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id),
    CONSTRAINT fk_updated_by FOREIGN KEY (updated_by) REFERENCES auth.users(id),
    CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT positive_weekly_hours_cap CHECK (weekly_hours_cap >= 0),
    CONSTRAINT positive_overtime_hours CHECK (max_overtime_hours >= 0)
);

-- Shift Options Table
CREATE TABLE IF NOT EXISTS public.shift_options (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    start_time time NOT NULL,
    end_time time NOT NULL,
    duration_hours integer NOT NULL,
    is_default boolean DEFAULT FALSE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT valid_shift_duration CHECK (duration_hours IN (4, 10, 12))
);

-- Schedule Periods Table
CREATE TABLE IF NOT EXISTS public.schedule_periods (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_published boolean DEFAULT FALSE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Staffing Requirements Table
CREATE TABLE IF NOT EXISTS public.staffing_requirements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_period_id uuid REFERENCES public.schedule_periods(id),
    time_block_start time NOT NULL,
    time_block_end time NOT NULL,
    min_employees integer NOT NULL,
    day_of_week text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- Assigned Shifts Table (Renamed from Schedules)
CREATE TABLE IF NOT EXISTS public.assigned_shifts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id uuid REFERENCES public.employees(id),
    schedule_period_id uuid REFERENCES public.schedule_periods(id),
    shift_option_id uuid REFERENCES public.shift_options(id),
    date date NOT NULL,
    status public.shift_status NOT NULL DEFAULT 'scheduled',
    notes text,
    overtime_approved BOOLEAN DEFAULT false,
    overtime_approved_by UUID REFERENCES auth.users(id),
    overtime_approved_at TIMESTAMPTZ,
    actual_hours_worked DECIMAL(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- Time Off Requests Table
CREATE TABLE IF NOT EXISTS public.time_off_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status public.time_off_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Shift Swap Requests Table
CREATE TABLE IF NOT EXISTS public.shift_swap_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requesting_employee_id UUID NOT NULL REFERENCES public.employees(id),
    receiving_employee_id UUID NOT NULL REFERENCES public.employees(id),
    requesting_shift_id UUID NOT NULL REFERENCES public.assigned_shifts(id),
    receiving_shift_id UUID REFERENCES public.assigned_shifts(id),
    status public.swap_request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT different_employees CHECK (requesting_employee_id != receiving_employee_id)
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
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    assignment_id uuid REFERENCES public.on_call_assignments(id),
    activation_time timestamptz NOT NULL,
    deactivation_time timestamptz,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_activation_period CHECK (
        (deactivation_time IS NULL) OR (deactivation_time > activation_time)
    )
);

-- Holidays Table
CREATE TABLE IF NOT EXISTS holidays (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    name text NOT NULL,
    type holiday_type NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Shift Pattern Rules Table
CREATE TABLE IF NOT EXISTS shift_pattern_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    pattern public.shift_pattern NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
); 