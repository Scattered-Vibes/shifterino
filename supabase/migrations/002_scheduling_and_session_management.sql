-- 002_scheduling_and_session_management.sql
--
-- This consolidated migration covers the scheduling system:
-- • Core scheduling tables (shift_options, staffing_requirements, etc.)
-- • Schedule periods, individual shifts and related triggers/materialized views
-- • Schedules table with RLS policies for employees and supervisors
-- • Updates to employee records (weekly_hours column)
-- • A new validate_session function for JWT-based session validation
-- • Policy updates for profiles and employees (RLS)

--------------------
-- Section 1: Scheduling Core Tables
--------------------
CREATE TABLE public.shift_options (
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
    shift_durations integer[] NOT NULL,
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

CREATE TABLE public.individual_shifts (
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
    actual_hours_worked decimal(5,2),
    notes text,
    schedule_conflict_notes text,
    is_regular_schedule boolean NOT NULL DEFAULT true,
    supervisor_approved_by uuid REFERENCES public.employees(id),
    supervisor_approved_at timestamptz,
    shift_score integer,
    fatigue_level integer,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_break_times CHECK (
        (break_start_time IS NULL AND break_end_time IS NULL) OR
        (break_start_time IS NOT NULL AND break_end_time IS NOT NULL AND break_start_time < break_end_time)
    ),
    CONSTRAINT valid_actual_times CHECK (
        (actual_start_time IS NULL AND actual_end_time IS NULL) OR
        (actual_start_time IS NOT NULL AND actual_end_time IS NOT NULL AND actual_start_time < actual_end_time)
    ),
    CONSTRAINT supervisor_approval_complete CHECK (
        (supervisor_approved_by IS NULL AND supervisor_approved_at IS NULL) OR
        (supervisor_approved_by IS NOT NULL AND supervisor_approved_at IS NOT NULL)
    ),
    CONSTRAINT valid_shift_hours CHECK (actual_hours_worked >= 0 AND actual_hours_worked <= 24),
    CONSTRAINT valid_break_duration CHECK (break_duration_minutes >= 0 AND break_duration_minutes <= 60)
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
    requester_id uuid NOT NULL REFERENCES public.employees(id),
    requested_employee_id uuid NOT NULL REFERENCES public.employees(id),
    shift_id uuid NOT NULL REFERENCES public.individual_shifts(id),
    proposed_shift_id uuid REFERENCES public.individual_shifts(id),
    status public.time_off_status NOT NULL DEFAULT 'pending',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT different_employees CHECK (requester_id != requested_employee_id)
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
        preference_score >= 0 AND
        fatigue_score >= 0 AND
        fairness_score >= 0
    )
);

CREATE TABLE public.system_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key text UNIQUE NOT NULL,
    setting_value text NOT NULL,
    description text,
    is_encrypted boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

--------------------
-- Section 2: Schedules & RLS
--------------------
CREATE TABLE public.schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    start_date date NOT NULL,
    end_date date NOT NULL,
    employee_id uuid NOT NULL REFERENCES public.employees(auth_id),
    shift_type text NOT NULL CHECK (shift_type IN ('day_early', 'day', 'swing', 'graveyard')),
    shift_pattern public.shift_pattern NOT NULL,
    is_supervisor boolean NOT NULL DEFAULT false,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_by uuid NOT NULL REFERENCES auth.users(id),
    updated_by uuid NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own schedules"
    ON public.schedules
    FOR SELECT
    USING (auth.uid() = employee_id);

CREATE POLICY "Supervisors can view all schedules"
    ON public.schedules
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE auth_id = auth.uid()
            AND role = 'supervisor'
        )
    );

CREATE POLICY "Supervisors can manage schedules"
    ON public.schedules
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE auth_id = auth.uid()
            AND role = 'supervisor'
        )
    );

CREATE INDEX idx_schedules_employee_id ON public.schedules(employee_id);
CREATE INDEX idx_schedules_date_range ON public.schedules(start_date, end_date);
CREATE INDEX idx_schedules_shift_type ON public.schedules(shift_type);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Section 3: Employee Scheduling Updates & Session Validation
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS weekly_hours integer NOT NULL DEFAULT 40;
ALTER TABLE public.employees
ADD CONSTRAINT weekly_hours_check CHECK (weekly_hours >= 0 AND weekly_hours <= 168);
UPDATE public.employees SET weekly_hours = 40 WHERE weekly_hours IS NULL;

DROP FUNCTION IF EXISTS public.validate_session(json);
CREATE OR REPLACE FUNCTION public.validate_session(session_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  session_id uuid;
BEGIN
  BEGIN
    session_id := session_token::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;

  RETURN EXISTS (
    SELECT 1 FROM auth.sessions s
    WHERE s.id = session_id
      AND (s.not_after IS NULL OR s.not_after > now())
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_session(text) TO authenticated, service_role; 