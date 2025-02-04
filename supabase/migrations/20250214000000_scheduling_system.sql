--
-- Scheduling System Migration
-- Combines all scheduling-related functionality
--

-- Create scheduling-related tables

-- Create shift_options table
CREATE TABLE public.shift_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours INTEGER NOT NULL,
    category public.shift_category NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_duration CHECK (duration_hours IN (4, 10, 12))
);

-- Create staffing_requirements table
CREATE TABLE public.staffing_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    time_block_start TIME NOT NULL,
    time_block_end TIME NOT NULL,
    min_total_staff INTEGER NOT NULL,
    min_supervisors INTEGER NOT NULL DEFAULT 1,
    schedule_period_id UUID,
    is_holiday BOOLEAN DEFAULT false,
    override_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create shift_pattern_rules table
CREATE TABLE public.shift_pattern_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern public.shift_pattern NOT NULL,
    consecutive_shifts INTEGER NOT NULL,
    shift_durations INTEGER[] NOT NULL,
    min_rest_hours INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_consecutive_shifts CHECK (consecutive_shifts > 0),
    CONSTRAINT valid_min_rest CHECK (min_rest_hours >= 8)
);

-- Create schedule_periods table
CREATE TABLE public.schedule_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Create individual_shifts table
CREATE TABLE public.individual_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    shift_option_id UUID NOT NULL REFERENCES public.shift_options(id),
    schedule_period_id UUID REFERENCES public.schedule_periods(id),
    date DATE NOT NULL,
    status public.shift_status NOT NULL DEFAULT 'scheduled',
    is_overtime BOOLEAN NOT NULL DEFAULT false,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    break_start_time TIMESTAMPTZ,
    break_end_time TIMESTAMPTZ,
    break_duration_minutes INTEGER,
    actual_hours_worked DECIMAL(5,2),
    notes TEXT,
    schedule_conflict_notes TEXT,
    is_regular_schedule BOOLEAN NOT NULL DEFAULT true,
    supervisor_approved_by UUID REFERENCES public.employees(id),
    supervisor_approved_at TIMESTAMPTZ,
    shift_score INTEGER,
    fatigue_level INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_break_times 
        CHECK (
            (break_start_time IS NULL AND break_end_time IS NULL) OR
            (break_start_time IS NOT NULL AND break_end_time IS NOT NULL AND
             break_start_time < break_end_time)
        ),
    CONSTRAINT valid_actual_times 
        CHECK (
            (actual_start_time IS NULL AND actual_end_time IS NULL) OR
            (actual_start_time IS NOT NULL AND actual_end_time IS NOT NULL AND
             actual_start_time < actual_end_time)
        ),
    CONSTRAINT supervisor_approval_complete
        CHECK (
            (supervisor_approved_by IS NULL AND supervisor_approved_at IS NULL) OR
            (supervisor_approved_by IS NOT NULL AND supervisor_approved_at IS NOT NULL)
        ),
    CONSTRAINT valid_shift_hours 
        CHECK (actual_hours_worked >= 0 AND actual_hours_worked <= 24),
    CONSTRAINT valid_break_duration
        CHECK (break_duration_minutes >= 0 AND break_duration_minutes <= 60)
);

-- Create time_off_requests table
CREATE TABLE public.time_off_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status public.time_off_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create shift_swap_requests table
CREATE TABLE public.shift_swap_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.employees(id),
    requested_employee_id UUID NOT NULL REFERENCES public.employees(id),
    shift_id UUID NOT NULL REFERENCES public.individual_shifts(id),
    proposed_shift_id UUID REFERENCES public.individual_shifts(id),
    status public.time_off_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT different_employees CHECK (requester_id != requested_employee_id)
);

-- Create scheduling_logs table
CREATE TABLE public.scheduling_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_period_id UUID REFERENCES public.schedule_periods(id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    log_message TEXT NOT NULL,
    severity public.log_severity NOT NULL,
    related_employee_id UUID REFERENCES public.employees(id),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shift_assignment_scores table
CREATE TABLE public.shift_assignment_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    shift_id UUID NOT NULL REFERENCES public.individual_shifts(id),
    schedule_period_id UUID NOT NULL REFERENCES public.schedule_periods(id),
    preference_score INTEGER NOT NULL,
    fatigue_score INTEGER NOT NULL,
    fairness_score INTEGER NOT NULL,
    total_score INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_scores CHECK (
        preference_score >= 0 AND
        fatigue_score >= 0 AND
        fairness_score >= 0
    )
);

-- Create system_settings table
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_shift_options_updated_at
    BEFORE UPDATE ON public.shift_options
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staffing_requirements_updated_at
    BEFORE UPDATE ON public.staffing_requirements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shift_pattern_rules_updated_at
    BEFORE UPDATE ON public.shift_pattern_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_periods_updated_at
    BEFORE UPDATE ON public.schedule_periods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_individual_shifts_updated_at
    BEFORE UPDATE ON public.individual_shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_off_requests_updated_at
    BEFORE UPDATE ON public.time_off_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shift_swap_requests_updated_at
    BEFORE UPDATE ON public.shift_swap_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_individual_shifts_employee_date ON individual_shifts(employee_id, date);
CREATE INDEX idx_individual_shifts_date_range ON individual_shifts(date, employee_id, shift_option_id);
CREATE INDEX idx_individual_shifts_status ON individual_shifts(status, date);
CREATE INDEX idx_individual_shifts_employee_period ON individual_shifts(employee_id, schedule_period_id);

CREATE INDEX idx_time_off_requests_date_range ON time_off_requests(start_date, end_date);
CREATE INDEX idx_time_off_requests_status ON time_off_requests(status, employee_id);

CREATE INDEX idx_shift_swap_requests_status ON shift_swap_requests(status);
CREATE INDEX idx_shift_swap_requests_employees ON shift_swap_requests(requester_id, requested_employee_id);

CREATE INDEX idx_shift_assignment_scores_total ON shift_assignment_scores(total_score);
CREATE INDEX idx_shift_assignment_scores_period ON shift_assignment_scores(schedule_period_id, employee_id);

CREATE INDEX idx_schedule_periods_active ON schedule_periods(is_active, start_date, end_date);
CREATE INDEX idx_schedule_periods_date_range ON schedule_periods(start_date, end_date);

CREATE INDEX idx_shift_options_category ON shift_options(category);
CREATE INDEX idx_shift_options_duration ON shift_options(duration_hours);

CREATE INDEX idx_staffing_requirements_period ON staffing_requirements(schedule_period_id, time_block_start);
CREATE INDEX idx_staffing_requirements_holiday ON staffing_requirements(is_holiday, schedule_period_id);

CREATE INDEX idx_system_settings_key ON system_settings(setting_key) WHERE NOT is_encrypted;

-- Create partial indexes for common queries
CREATE INDEX idx_active_shifts ON individual_shifts(employee_id, date)
WHERE status = 'scheduled';

CREATE INDEX idx_pending_swap_requests ON shift_swap_requests(requester_id)
WHERE status = 'pending';

CREATE INDEX idx_current_period ON schedule_periods(start_date)
WHERE is_active = true;

-- Create views for common queries
CREATE OR REPLACE VIEW v_current_schedule AS
SELECT 
    i.id as shift_id,
    i.date,
    i.employee_id,
    e.first_name,
    e.last_name,
    e.role,
    so.start_time,
    so.end_time,
    so.category as shift_category,
    i.actual_hours_worked,
    i.status,
    sp.id as schedule_period_id
FROM individual_shifts i
JOIN employees e ON e.id = i.employee_id
JOIN shift_options so ON so.id = i.shift_option_id
JOIN schedule_periods sp ON sp.id = i.schedule_period_id
WHERE sp.is_active = true
AND i.status = 'scheduled';

-- Create view for staffing level analysis
CREATE OR REPLACE VIEW v_staffing_levels AS
SELECT 
    i.date,
    so.start_time,
    so.end_time,
    COUNT(*) as total_staff,
    SUM(CASE WHEN e.role = 'supervisor' THEN 1 ELSE 0 END) as supervisor_count,
    sr.min_total_staff,
    sr.min_supervisors
FROM individual_shifts i
JOIN employees e ON e.id = i.employee_id
JOIN shift_options so ON so.id = i.shift_option_id
JOIN staffing_requirements sr ON 
    sr.time_block_start = so.start_time 
    AND sr.time_block_end = so.end_time
WHERE i.status = 'scheduled'
GROUP BY i.date, so.start_time, so.end_time, sr.min_total_staff, sr.min_supervisors;

-- Drop and recreate materialized view for statistics
DO $$ 
BEGIN
    -- Drop the view if it exists
    DROP MATERIALIZED VIEW IF EXISTS mv_schedule_statistics;
    
    -- Create the materialized view
    CREATE MATERIALIZED VIEW mv_schedule_statistics AS
    SELECT 
        e.id as employee_id,
        e.first_name,
        e.last_name,
        e.role,
        COUNT(i.id) as total_shifts,
        AVG(i.actual_hours_worked) as avg_hours_per_shift,
        SUM(i.actual_hours_worked) as total_hours,
        COUNT(DISTINCT sp.id) as periods_worked,
        AVG(sas.total_score) as avg_score
    FROM employees e
    LEFT JOIN individual_shifts i ON i.employee_id = e.id
    LEFT JOIN schedule_periods sp ON sp.id = i.schedule_period_id
    LEFT JOIN shift_assignment_scores sas ON sas.employee_id = e.id
    GROUP BY e.id, e.first_name, e.last_name, e.role
    WITH DATA;

    -- Create unique index on the view
    CREATE UNIQUE INDEX idx_mv_schedule_statistics ON mv_schedule_statistics(employee_id);
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise
        RAISE NOTICE 'Error creating materialized view: %', SQLERRM;
        RAISE;
END $$;

-- Create maintenance functions
CREATE OR REPLACE FUNCTION refresh_schedule_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_schedule_statistics;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION analyze_scheduling_tables()
RETURNS void AS $$
BEGIN
    ANALYZE employees;
    ANALYZE individual_shifts;
    ANALYZE schedule_periods;
    ANALYZE shift_assignment_scores;
    ANALYZE time_off_requests;
    ANALYZE shift_swap_requests;
    ANALYZE staffing_requirements;
    ANALYZE shift_options;
    ANALYZE system_settings;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on all tables
ALTER TABLE schedule_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_pattern_rules ENABLE ROW LEVEL SECURITY;

-- Additional indexes for performance optimization

-- Indexes for employee queries
CREATE INDEX IF NOT EXISTS idx_employees_auth_id ON employees(auth_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_shift_pattern ON employees(shift_pattern);
CREATE INDEX IF NOT EXISTS idx_employees_preferred_shift_category ON employees(preferred_shift_category);

-- Composite indexes for schedule queries
CREATE INDEX IF NOT EXISTS idx_individual_shifts_employee_period ON individual_shifts(employee_id, schedule_period_id);
CREATE INDEX IF NOT EXISTS idx_individual_shifts_date_range ON individual_shifts(date, employee_id, shift_option_id);
CREATE INDEX IF NOT EXISTS idx_individual_shifts_status ON individual_shifts(status, date);

-- Indexes for time-off management
CREATE INDEX IF NOT EXISTS idx_time_off_requests_date_range ON time_off_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_status ON time_off_requests(status, employee_id);

-- Indexes for shift swaps
CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_status ON shift_swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_employees ON shift_swap_requests(requester_id, requested_employee_id);

-- Indexes for scoring
CREATE INDEX IF NOT EXISTS idx_shift_assignment_scores_total ON shift_assignment_scores(total_score);
CREATE INDEX IF NOT EXISTS idx_shift_assignment_scores_period ON shift_assignment_scores(schedule_period_id, employee_id);

-- Indexes for schedule periods
CREATE INDEX IF NOT EXISTS idx_schedule_periods_active ON schedule_periods(is_active, start_date, end_date);

-- Indexes for shift options
CREATE INDEX IF NOT EXISTS idx_shift_options_category ON shift_options(category);
CREATE INDEX IF NOT EXISTS idx_shift_options_duration ON shift_options(duration_hours);

-- Composite indexes for staffing requirements
CREATE INDEX IF NOT EXISTS idx_staffing_requirements_period ON staffing_requirements(schedule_period_id, time_block_start);
CREATE INDEX IF NOT EXISTS idx_staffing_requirements_holiday ON staffing_requirements(is_holiday, schedule_period_id);

-- Indexes for system settings
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key) WHERE NOT is_encrypted;

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_active_shifts ON individual_shifts(employee_id, date)
WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_pending_swap_requests ON shift_swap_requests(requester_id)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_current_period ON schedule_periods(start_date)
WHERE is_active = true;

-- Create views for common queries
CREATE OR REPLACE VIEW v_current_schedule AS
SELECT 
    i.id as shift_id,
    i.date,
    i.employee_id,
    e.first_name,
    e.last_name,
    e.role,
    so.start_time,
    so.end_time,
    so.category as shift_category,
    i.actual_hours_worked,
    i.status,
    sp.id as schedule_period_id
FROM individual_shifts i
JOIN employees e ON e.id = i.employee_id
JOIN shift_options so ON so.id = i.shift_option_id
JOIN schedule_periods sp ON sp.id = i.schedule_period_id
WHERE sp.is_active = true
AND i.status = 'scheduled';

-- Create view for staffing level analysis
CREATE OR REPLACE VIEW v_staffing_levels AS
SELECT 
    i.date,
    so.start_time,
    so.end_time,
    COUNT(*) as total_staff,
    SUM(CASE WHEN e.role = 'supervisor' THEN 1 ELSE 0 END) as supervisor_count,
    sr.min_total_staff,
    sr.min_supervisors
FROM individual_shifts i
JOIN employees e ON e.id = i.employee_id
JOIN shift_options so ON so.id = i.shift_option_id
JOIN staffing_requirements sr ON 
    sr.time_block_start = so.start_time 
    AND sr.time_block_end = so.end_time
WHERE i.status = 'scheduled'
GROUP BY i.date, so.start_time, so.end_time, sr.min_total_staff, sr.min_supervisors;

-- Enhanced RLS policies

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS employee_role AS $$
DECLARE
    user_role employee_role;
BEGIN
    SELECT role INTO user_role
    FROM employees
    WHERE auth_id = auth.uid();
    RETURN user_role;
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if user is supervisor or above
CREATE OR REPLACE FUNCTION is_supervisor_or_above()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('supervisor', 'manager');
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if user is manager
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'manager';
END;
$$ LANGUAGE plpgsql;

-- Drop existing basic policies
DROP POLICY IF EXISTS "View schedule periods" ON schedule_periods;
DROP POLICY IF EXISTS "View own logs" ON scheduling_logs;
DROP POLICY IF EXISTS "View non-sensitive settings" ON system_settings;
DROP POLICY IF EXISTS "View own swap requests" ON shift_swap_requests;
DROP POLICY IF EXISTS "View own shifts" ON individual_shifts;
DROP POLICY IF EXISTS "View own requests" ON time_off_requests;

-- Enhanced policies for schedule_periods
CREATE POLICY "View schedule periods" ON schedule_periods
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Manage schedule periods" ON schedule_periods
    FOR ALL
    USING (is_manager());

-- Enhanced policies for scheduling_logs
CREATE POLICY "View own logs" ON scheduling_logs
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        related_employee_id IN (
            SELECT id FROM employees WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "View all logs as supervisor" ON scheduling_logs
    FOR SELECT
    USING (is_supervisor_or_above());

CREATE POLICY "Create logs" ON scheduling_logs
    FOR INSERT
    WITH CHECK (is_supervisor_or_above());

-- Enhanced policies for system_settings
CREATE POLICY "View non-sensitive settings" ON system_settings
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        NOT is_encrypted
    );

CREATE POLICY "View all settings" ON system_settings
    FOR SELECT
    USING (is_manager());

CREATE POLICY "Manage settings" ON system_settings
    FOR ALL
    USING (is_manager());

-- Enhanced policies for shift_swap_requests
CREATE POLICY "View own swap requests" ON shift_swap_requests
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        (requester_id IN (SELECT id FROM employees WHERE auth_id = auth.uid()) OR
         requested_employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid()))
    );

CREATE POLICY "View all swap requests" ON shift_swap_requests
    FOR SELECT
    USING (is_supervisor_or_above());

CREATE POLICY "Create swap requests" ON shift_swap_requests
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        requester_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
    );

CREATE POLICY "Update own swap requests" ON shift_swap_requests
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        requester_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
    );

CREATE POLICY "Manage all swap requests" ON shift_swap_requests
    FOR ALL
    USING (is_supervisor_or_above());

-- Enhanced policies for shift_assignment_scores
CREATE POLICY "View own scores" ON shift_assignment_scores
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
    );

CREATE POLICY "View all scores" ON shift_assignment_scores
    FOR SELECT
    USING (is_supervisor_or_above());

CREATE POLICY "Manage scores" ON shift_assignment_scores
    FOR ALL
    USING (is_manager());

-- Enhanced policies for individual_shifts
CREATE POLICY "View own shifts" ON individual_shifts
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
    );

CREATE POLICY "View all shifts" ON individual_shifts
    FOR SELECT
    USING (is_supervisor_or_above());

CREATE POLICY "Manage shifts" ON individual_shifts
    FOR ALL
    USING (is_supervisor_or_above());

-- Enhanced policies for time_off_requests
CREATE POLICY "View own requests" ON time_off_requests
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
    );

CREATE POLICY "View all requests" ON time_off_requests
    FOR SELECT
    USING (is_supervisor_or_above());

CREATE POLICY "Create requests" ON time_off_requests
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
    );

CREATE POLICY "Update own requests" ON time_off_requests
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid()) AND
        status = 'pending'
    );

CREATE POLICY "Manage all requests" ON time_off_requests
    FOR ALL
    USING (is_supervisor_or_above());

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 