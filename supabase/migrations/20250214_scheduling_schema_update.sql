-- Create custom types
CREATE TYPE shift_category AS ENUM ('Day', 'Night', 'Rotating');
CREATE TYPE employee_role AS ENUM ('Dispatcher', 'Supervisor', 'Manager');
CREATE TYPE time_off_status AS ENUM ('Requested', 'Approved', 'Rejected');
CREATE TYPE shift_status AS ENUM ('Scheduled', 'Completed', 'Cancelled', 'Modified');
CREATE TYPE shift_pattern AS ENUM ('A', 'B', 'Custom');
CREATE TYPE log_severity AS ENUM ('INFO', 'WARNING', 'ERROR');

-- Add schedule_periods table
CREATE TABLE schedule_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Add scheduling_logs table
CREATE TABLE scheduling_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_period_id UUID REFERENCES schedule_periods(id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    log_message TEXT NOT NULL,
    severity log_severity NOT NULL,
    related_employee_id UUID REFERENCES employees(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add system_settings table
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add shift_swap_requests table
CREATE TABLE shift_swap_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES employees(id),
    requested_employee_id UUID NOT NULL REFERENCES employees(id),
    shift_id UUID NOT NULL REFERENCES individual_shifts(id),
    proposed_shift_id UUID REFERENCES individual_shifts(id),
    status time_off_status NOT NULL DEFAULT 'Requested',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT different_employees CHECK (requester_id != requested_employee_id)
);

-- Add shift_assignment_scores table
CREATE TABLE shift_assignment_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    shift_id UUID NOT NULL REFERENCES individual_shifts(id),
    schedule_period_id UUID NOT NULL REFERENCES schedule_periods(id),
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

-- Modify existing tables

-- Add fields to employees table
ALTER TABLE employees
ADD COLUMN max_overtime_hours INTEGER DEFAULT 0,
ADD COLUMN last_shift_date DATE,
ADD COLUMN total_hours_current_week INTEGER DEFAULT 0,
ADD COLUMN consecutive_shifts_count INTEGER DEFAULT 0;

-- Enhance individual_shifts table
ALTER TABLE individual_shifts
ADD COLUMN schedule_period_id UUID REFERENCES schedule_periods(id),
ADD COLUMN shift_score INTEGER,
ADD COLUMN fatigue_level INTEGER,
ADD COLUMN break_duration_minutes INTEGER,
ADD COLUMN actual_hours_worked DECIMAL(5,2),
ADD COLUMN schedule_conflict_notes TEXT;

-- Update staffing_requirements table
ALTER TABLE staffing_requirements
ADD COLUMN schedule_period_id UUID REFERENCES schedule_periods(id),
ADD COLUMN is_holiday BOOLEAN DEFAULT false,
ADD COLUMN override_reason TEXT;

-- Create indexes for performance
CREATE INDEX idx_individual_shifts_employee_date ON individual_shifts(employee_id, date);
CREATE INDEX idx_schedule_periods_date_range ON schedule_periods(start_date, end_date);
CREATE INDEX idx_staffing_requirements_time_block ON staffing_requirements(time_block_start, time_block_end);
CREATE INDEX idx_shift_assignment_scores_employee ON shift_assignment_scores(employee_id, schedule_period_id);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_individual_shifts_updated_at
    BEFORE UPDATE ON individual_shifts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE schedule_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignment_scores ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (to be refined based on specific requirements)
CREATE POLICY "Allow all access to authenticated users" ON schedule_periods
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access to authenticated users" ON scheduling_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow managers to manage system settings" ON system_settings
    FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'Manager'
    ));

CREATE POLICY "Allow employees to manage their own swap requests" ON shift_swap_requests
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            requester_id IN (SELECT id FROM employees WHERE auth_id = auth.uid()) OR
            requested_employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
        )
    );

CREATE POLICY "Allow read access to authenticated users for scores" ON shift_assignment_scores
    FOR SELECT USING (auth.role() = 'authenticated'); 