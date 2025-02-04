-- 20250214000000_scheduling_system.sql
--
-- Consolidated Scheduling System: Tables, Indexes, Functions, Triggers, Materialized Views
--

-- Create scheduling-related tables

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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status public.time_off_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add updated_at triggers for scheduling system tables (reuse update_updated_at_column)
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

-- Create essential indexes for performance
CREATE INDEX idx_individual_shifts_employee_date ON public.individual_shifts(employee_id, date);
CREATE INDEX idx_individual_shifts_status ON public.individual_shifts(status, date);
CREATE INDEX idx_time_off_requests_date_range ON public.time_off_requests(start_date, end_date);
CREATE INDEX idx_schedule_periods_active ON public.schedule_periods(is_active, start_date, end_date);
CREATE INDEX idx_shift_options_category ON public.shift_options(category);

-- Materialized view for scheduling statistics
DROP MATERIALIZED VIEW IF EXISTS public.mv_schedule_statistics;
CREATE MATERIALIZED VIEW public.mv_schedule_statistics AS
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
FROM public.employees e
LEFT JOIN public.individual_shifts i ON i.employee_id = e.id
LEFT JOIN public.schedule_periods sp ON sp.id = i.schedule_period_id
LEFT JOIN public.shift_assignment_scores sas ON sas.employee_id = e.id
GROUP BY e.id, e.first_name, e.last_name, e.role
WITH DATA;

CREATE UNIQUE INDEX idx_mv_schedule_statistics ON public.mv_schedule_statistics(employee_id);

-- Maintenance functions
CREATE OR REPLACE FUNCTION public.refresh_schedule_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_schedule_statistics;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.analyze_scheduling_tables()
RETURNS void AS $$
BEGIN
    ANALYZE public.employees;
    ANALYZE public.individual_shifts;
    ANALYZE public.schedule_periods;
    ANALYZE public.shift_assignment_scores;
    ANALYZE public.time_off_requests;
    ANALYZE public.shift_swap_requests;
    ANALYZE public.staffing_requirements;
    ANALYZE public.shift_options;
    ANALYZE public.system_settings;
END;
$$ LANGUAGE plpgsql;

-- Scheduling Functions

-- Calculate consecutive shifts
CREATE OR REPLACE FUNCTION public.calculate_consecutive_shifts(
    p_employee_id UUID,
    p_date DATE
) RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
    v_consecutive INTEGER;
    v_start_date DATE;
BEGIN
    SELECT date INTO v_start_date
    FROM public.individual_shifts
    WHERE employee_id = p_employee_id
      AND date < p_date
      AND status = 'completed'
    ORDER BY date DESC
    LIMIT 1;
    
    IF v_start_date IS NULL THEN
      RETURN 0;
    END IF;
    
    WITH RECURSIVE shift_chain(shift_date, consecutive_count) AS (
      SELECT v_start_date, 1
      UNION ALL
      SELECT s.date, sc.consecutive_count + 1
      FROM shift_chain sc
      JOIN public.individual_shifts s ON s.date = sc.shift_date - INTERVAL '1 day'
      WHERE s.employee_id = p_employee_id
        AND s.status = 'completed'
    )
    SELECT COALESCE(MAX(consecutive_count), 0) INTO v_consecutive
    FROM shift_chain;
    
    RETURN v_consecutive;
END;
$$;

-- Calculate weekly hours
CREATE OR REPLACE FUNCTION public.calculate_weekly_hours(
    p_employee_id UUID,
    p_start_date DATE
) RETURNS DECIMAL
LANGUAGE plpgsql AS $$
DECLARE
    v_total_hours DECIMAL;
BEGIN
    SELECT COALESCE(SUM(actual_hours_worked), 0)
    INTO v_total_hours
    FROM public.individual_shifts
    WHERE employee_id = p_employee_id
      AND date >= p_start_date
      AND date < p_start_date + INTERVAL '7 days'
      AND status IN ('completed', 'scheduled');
    
    RETURN v_total_hours;
END;
$$;

-- Validate shift pattern (using business rules)
CREATE OR REPLACE FUNCTION public.validate_shift_pattern(
    p_employee_id UUID,
    p_shift_date DATE,
    p_shift_duration INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_pattern public.shift_pattern;
    v_weekly_cap INTEGER;
    v_consecutive INTEGER;
    v_pattern_rule RECORD;
BEGIN
    SELECT shift_pattern, weekly_hours_cap INTO v_pattern, v_weekly_cap
    FROM public.employees
    WHERE id = p_employee_id;
    
    SELECT * INTO v_pattern_rule
    FROM public.shift_pattern_rules
    WHERE pattern = v_pattern;
    
    v_consecutive := public.calculate_consecutive_shifts(p_employee_id, p_shift_date);
    IF v_consecutive >= v_pattern_rule.consecutive_shifts THEN
      RETURN FALSE;
    END IF;
    
    IF NOT (p_shift_duration = ANY(v_pattern_rule.shift_durations)) THEN
      RETURN FALSE;
    END IF;
    
    IF public.calculate_weekly_hours(p_employee_id, p_shift_date) + p_shift_duration > v_weekly_cap THEN
      RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Validate staffing requirements
CREATE OR REPLACE FUNCTION public.validate_staffing_requirements(
    p_date DATE,
    p_time_block_start TIME,
    p_time_block_end TIME
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_staff INTEGER;
    v_current_supervisors INTEGER;
    v_required RECORD;
BEGIN
    SELECT min_total_staff, min_supervisors INTO v_required
    FROM public.staffing_requirements
    WHERE time_block_start = p_time_block_start
      AND time_block_end = p_time_block_end
      AND (schedule_period_id IS NULL OR schedule_period_id IN (
          SELECT id FROM public.schedule_periods
          WHERE start_date <= p_date AND end_date >= p_date
      ));
    
    SELECT COUNT(*) as total_staff,
           SUM(CASE WHEN e.role = 'supervisor' THEN 1 ELSE 0 END) as supervisor_count
    INTO v_current_staff, v_current_supervisors
    FROM public.individual_shifts s
    JOIN public.employees e ON e.id = s.employee_id
    JOIN public.shift_options so ON so.id = s.shift_option_id
    WHERE s.date = p_date
      AND s.status = 'scheduled'
      AND so.start_time <= p_time_block_start
      AND so.end_time >= p_time_block_end;
    
    RETURN v_current_staff >= v_required.min_total_staff AND v_current_supervisors >= v_required.min_supervisors;
END;
$$ LANGUAGE plpgsql;

-- Calculate shift score
CREATE OR REPLACE FUNCTION public.calculate_shift_score(
    p_employee_id UUID,
    p_shift_option_id UUID,
    p_date DATE
) RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
    v_employee RECORD;
    v_shift RECORD;
    v_consecutive INTEGER;
    v_weekly_hours DECIMAL;
BEGIN
    SELECT * INTO v_employee FROM public.employees WHERE id = p_employee_id;
    SELECT * INTO v_shift FROM public.shift_options WHERE id = p_shift_option_id;
    
    IF v_employee.preferred_shift_category = v_shift.category THEN
      v_score := v_score + 40;
    END IF;
    
    v_consecutive := public.calculate_consecutive_shifts(p_employee_id, p_date);
    v_score := v_score + (30 - (v_consecutive * 5));
    
    v_weekly_hours := public.calculate_weekly_hours(p_employee_id, p_date);
    v_score := v_score + (30 - (v_weekly_hours::INTEGER / 2));
    
    RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql;

-- Generate schedule for a given period (iterative approach)
CREATE OR REPLACE FUNCTION public.generate_schedule_for_period(
    p_period_id UUID
) RETURNS TABLE (
    employee_id UUID,
    shift_id UUID,
    score INTEGER
) AS $$
DECLARE
    v_period RECORD;
    v_current_date DATE;
    v_shift RECORD;
    v_employee RECORD;
    v_score INTEGER;
BEGIN
    SELECT * INTO v_period FROM public.schedule_periods WHERE id = p_period_id;
    v_current_date := v_period.start_date;
    WHILE v_current_date <= v_period.end_date LOOP
        FOR v_shift IN SELECT * FROM public.shift_options ORDER BY start_time LOOP
            FOR v_employee IN
                SELECT e.* FROM public.employees e
                WHERE NOT EXISTS (
                    SELECT 1 FROM public.time_off_requests t
                    WHERE t.employee_id = e.id
                      AND t.start_date <= v_current_date
                      AND t.end_date >= v_current_date
                      AND t.status = 'approved'
                )
                AND NOT EXISTS (
                    SELECT 1 FROM public.individual_shifts s
                    WHERE s.employee_id = e.id AND s.date = v_current_date
                )
                ORDER BY e.role DESC
            LOOP
                IF public.validate_shift_pattern(v_employee.id, v_current_date, v_shift.duration_hours) THEN
                    v_score := public.calculate_shift_score(v_employee.id, v_shift.id, v_current_date);
                    employee_id := v_employee.id;
                    shift_id := v_shift.id;
                    score := v_score;
                    RETURN NEXT;
                END IF;
            END LOOP;
        END LOOP;
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Log scheduling event
CREATE OR REPLACE FUNCTION public.log_scheduling_event(
    p_period_id UUID,
    p_message TEXT,
    p_severity public.log_severity,
    p_employee_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO public.scheduling_logs (schedule_period_id, log_message, severity, related_employee_id)
    VALUES (p_period_id, p_message, p_severity, p_employee_id);
END;
$$ LANGUAGE plpgsql;

-- Process shift swap request
CREATE OR REPLACE FUNCTION public.process_shift_swap(
    p_swap_request_id UUID,
    p_approved BOOLEAN,
    p_approver_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_request RECORD;
BEGIN
    SELECT * INTO v_request FROM public.shift_swap_requests WHERE id = p_swap_request_id;
    
    IF NOT EXISTS (
        SELECT 1 FROM public.employees WHERE id = p_approver_id AND role IN ('supervisor', 'manager')
    ) THEN
        RAISE EXCEPTION 'Unauthorized approval attempt';
    END IF;
    
    IF p_approved THEN
        UPDATE public.individual_shifts SET employee_id = v_request.requested_employee_id WHERE id = v_request.shift_id;
        IF v_request.proposed_shift_id IS NOT NULL THEN
            UPDATE public.individual_shifts SET employee_id = v_request.requester_id WHERE id = v_request.proposed_shift_id;
        END IF;
        UPDATE public.shift_swap_requests SET status = 'approved' WHERE id = p_swap_request_id;
        PERFORM public.log_scheduling_event(
            (SELECT schedule_period_id FROM public.individual_shifts WHERE id = v_request.shift_id),
            'Shift swap approved between employees',
            'info'::public.log_severity,
            v_request.requester_id
        );
    ELSE
        UPDATE public.shift_swap_requests SET status = 'rejected' WHERE id = p_swap_request_id;
        PERFORM public.log_scheduling_event(
            (SELECT schedule_period_id FROM public.individual_shifts WHERE id = v_request.shift_id),
            'Shift swap rejected',
            'info'::public.log_severity,
            v_request.requester_id
        );
    END IF;
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    PERFORM public.log_scheduling_event(
        (SELECT schedule_period_id FROM public.individual_shifts WHERE id = v_request.shift_id),
        'Error processing shift swap: ' || SQLERRM,
        'error'::public.log_severity,
        v_request.requester_id
    );
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Trigger for logging schedule changes on individual_shifts
CREATE OR REPLACE FUNCTION public.log_schedule_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.log_scheduling_event(
            NEW.schedule_period_id,
            'New shift assigned to employee',
            'info'::public.log_severity,
            NEW.employee_id
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.employee_id != NEW.employee_id THEN
            PERFORM public.log_scheduling_event(
                NEW.schedule_period_id,
                'Shift reassigned to different employee',
                'info'::public.log_severity,
                NEW.employee_id
            );
        ELSIF OLD.status != NEW.status THEN
            PERFORM public.log_scheduling_event(
                NEW.schedule_period_id,
                'Shift status changed from ' || OLD.status || ' to ' || NEW.status,
                'info'::public.log_severity,
                NEW.employee_id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_schedule_changes_trigger
    AFTER INSERT OR UPDATE ON public.individual_shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.log_schedule_changes();

-- Update employee statistics after shift changes
CREATE OR REPLACE FUNCTION public.update_employee_statistics()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.employees
    SET last_shift_date = NEW.date,
        consecutive_shifts_count = public.calculate_consecutive_shifts(NEW.employee_id, NEW.date),
        total_hours_current_week = (
            SELECT COALESCE(SUM(actual_hours_worked), 0)
            FROM public.individual_shifts
            WHERE employee_id = NEW.employee_id
              AND date >= NEW.date - INTERVAL '6 days'
              AND date <= NEW.date
        )
    WHERE id = NEW.employee_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employee_stats_trigger
    AFTER INSERT OR UPDATE ON public.individual_shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_employee_statistics();

-- Detect schedule conflicts
CREATE OR REPLACE FUNCTION public.detect_schedule_conflicts(
    p_employee_id UUID,
    p_shift_date DATE,
    p_start_time TIME,
    p_end_time TIME
) RETURNS TEXT AS $$
DECLARE
    conflict_message TEXT := NULL;
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.individual_shifts i
        JOIN public.shift_options s ON s.id = i.shift_option_id
        WHERE i.employee_id = p_employee_id
          AND i.date = p_shift_date
          AND (p_start_time, p_end_time) OVERLAPS (s.start_time, s.end_time)
    ) THEN
        conflict_message := 'Overlapping shift detected';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM public.individual_shifts i
        JOIN public.shift_options s ON s.id = i.shift_option_id
        WHERE i.employee_id = p_employee_id
          AND i.date = p_shift_date - INTERVAL '1 day'
          AND s.end_time + INTERVAL '8 hours' > p_start_time
    ) THEN
        conflict_message := COALESCE(conflict_message || '; ', '') || 'Insufficient rest period';
    END IF;
    
    IF (
        SELECT SUM(s.duration_hours)
        FROM public.individual_shifts i
        JOIN public.shift_options s ON s.id = i.shift_option_id
        WHERE i.employee_id = p_employee_id
          AND i.date BETWEEN p_shift_date - INTERVAL '6 days' AND p_shift_date
    ) > 40 THEN
        conflict_message := COALESCE(conflict_message || '; ', '') || 'Weekly hours limit exceeded';
    END IF;
    
    RETURN conflict_message;
END;
$$ LANGUAGE plpgsql;

-- Create trigger functions for business rules
CREATE OR REPLACE FUNCTION public.enforce_weekly_hours()
RETURNS TRIGGER AS $$
DECLARE
    total_hours INTEGER;
    new_shift_hours INTEGER;
    max_hours INTEGER;
BEGIN
    -- Get the employee's weekly hours cap
    SELECT weekly_hours_cap INTO max_hours
    FROM public.employees
    WHERE id = NEW.employee_id;

    -- Get the new shift's hours
    SELECT duration_hours INTO new_shift_hours
    FROM public.shift_options
    WHERE id = NEW.shift_option_id;

    -- Calculate total hours for the week including the new shift
    SELECT COALESCE(SUM(so.duration_hours), 0) + new_shift_hours INTO total_hours
    FROM public.individual_shifts s
    JOIN public.shift_options so ON s.shift_option_id = so.id
    WHERE s.employee_id = NEW.employee_id
    AND date_trunc('week', s.date) = date_trunc('week', NEW.date)
    AND s.status = 'scheduled'
    AND s.id != NEW.id;

    -- Check if total hours would exceed the cap
    IF total_hours > max_hours AND NOT NEW.is_overtime THEN
        RAISE EXCEPTION 'Cannot schedule more than % hours per week without overtime approval', max_hours;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.enforce_time_off_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for approved time off requests that conflict with the shift
    IF EXISTS (
        SELECT 1
        FROM public.time_off_requests
        WHERE employee_id = NEW.employee_id
        AND status = 'approved'
        AND NEW.date BETWEEN start_date AND end_date
    ) THEN
        RAISE EXCEPTION 'Cannot schedule shift during approved time off';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for business rules
CREATE TRIGGER enforce_weekly_hours_trigger
    BEFORE INSERT OR UPDATE ON public.individual_shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_weekly_hours();

CREATE TRIGGER enforce_time_off_conflicts_trigger
    BEFORE INSERT OR UPDATE ON public.individual_shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_time_off_conflicts();