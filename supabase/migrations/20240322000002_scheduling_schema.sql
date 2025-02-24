-- Create scheduling-related tables
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT schedules_org_name_unique UNIQUE (organization_id, name),
    CONSTRAINT schedules_dates_check CHECK (end_date >= start_date)
);

CREATE TABLE shift_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    day_of_week day_of_week NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    required_count INTEGER NOT NULL CHECK (required_count > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT shift_requirements_time_check CHECK (start_time < end_time)
);

-- Create shift_options table with proper category
CREATE TABLE shift_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours INTEGER NOT NULL,
    category shift_category NOT NULL,
    is_overnight BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    shift_category shift_category NOT NULL DEFAULT 'day',
    shift_option_id uuid REFERENCES shift_options(id),
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_auto_generated BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT shifts_time_check CHECK (start_time < end_time)
);

CREATE TABLE shift_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES employees(id),
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status shift_assignment_status NOT NULL DEFAULT 'ASSIGNED',
    CONSTRAINT shift_assignments_unique UNIQUE (shift_id, user_id)
);

CREATE TABLE shift_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    status shift_task_status NOT NULL DEFAULT 'NOT_STARTED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week day_of_week NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT TRUE,
    effective_start_date DATE,
    effective_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_availability_time_check CHECK (start_time < end_time),
    CONSTRAINT user_availability_dates_check CHECK (
        (effective_start_date IS NULL AND effective_end_date IS NULL) OR
        (effective_start_date IS NOT NULL AND effective_end_date IS NOT NULL AND
         effective_end_date >= effective_start_date)
    )
);

CREATE TABLE time_off_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status time_off_request_status NOT NULL DEFAULT 'pending',
    reason TEXT,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT time_off_dates_check CHECK (end_date >= start_date)
);

CREATE TABLE time_off_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,  -- e.g., "vacation", "sick", "personal"
    allocated DECIMAL NOT NULL,   -- Total allocated for the period
    used DECIMAL NOT NULL DEFAULT 0,
    accrued DECIMAL NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shift_swaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES shift_assignments(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status shift_swap_status NOT NULL DEFAULT 'pending',
    reason TEXT NOT NULL,
    manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create individual_shifts table
CREATE TABLE individual_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    shift_option_id UUID NOT NULL REFERENCES shift_options(id),
    date DATE NOT NULL,
    status shift_status DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (employee_id, date)
);

-- Create shift_swap_requests table
CREATE TABLE shift_swap_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES employees(id),
    requested_shift_id UUID NOT NULL REFERENCES individual_shifts(id),
    offered_shift_id UUID NOT NULL REFERENCES individual_shifts(id),
    status shift_swap_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT different_shifts CHECK (requested_shift_id != offered_shift_id)
);

-- Create indexes
CREATE INDEX idx_schedules_org ON schedules(organization_id);
CREATE INDEX idx_schedules_dates ON schedules(start_date, end_date);
CREATE INDEX idx_shift_requirements_org ON shift_requirements(organization_id);
CREATE INDEX idx_shift_requirements_composite ON shift_requirements(organization_id, day_of_week, start_time, end_time);
CREATE INDEX idx_shifts_schedule ON shifts(schedule_id);
CREATE INDEX idx_shifts_department ON shifts(department_id);
CREATE INDEX idx_shifts_date_time ON shifts(date, start_time, end_time);
CREATE INDEX idx_shift_assignments_shift ON shift_assignments(shift_id);
CREATE INDEX idx_shift_assignments_user ON shift_assignments(user_id);
CREATE INDEX idx_shift_tasks_shift ON shift_tasks(shift_id);
CREATE INDEX idx_shift_tasks_user ON shift_tasks(assigned_to);
CREATE INDEX idx_user_availability_user ON user_availability(user_id);
CREATE INDEX idx_user_availability_composite ON user_availability(user_id, day_of_week, start_time, end_time);
CREATE INDEX idx_time_off_requests_user ON time_off_requests(user_id);
CREATE INDEX idx_time_off_requests_status ON time_off_requests(status);
CREATE INDEX idx_time_off_requests_dates ON time_off_requests(start_date, end_date);
CREATE INDEX idx_time_off_balances_user ON time_off_balances(user_id);
CREATE INDEX idx_shift_swaps_assignment ON shift_swaps(assignment_id);
CREATE INDEX idx_shift_swaps_to_user ON shift_swaps(to_user_id);
CREATE INDEX idx_shift_swaps_status ON shift_swaps(status);
CREATE INDEX idx_shift_options_category ON shift_options(category);
CREATE INDEX idx_shift_options_duration ON shift_options(duration_hours);
CREATE INDEX idx_individual_shifts_employee_date ON individual_shifts(employee_id, date);
CREATE INDEX idx_individual_shifts_shift_option ON individual_shifts(shift_option_id);
CREATE INDEX idx_shift_swap_requests_status ON shift_swap_requests(status);

-- Create triggers for updated_at
CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_requirements_updated_at
    BEFORE UPDATE ON shift_requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
    BEFORE UPDATE ON shifts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_tasks_updated_at
    BEFORE UPDATE ON shift_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_availability_updated_at
    BEFORE UPDATE ON user_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_off_requests_updated_at
    BEFORE UPDATE ON time_off_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_off_balances_updated_at
    BEFORE UPDATE ON time_off_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_swaps_updated_at
    BEFORE UPDATE ON shift_swaps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_options_updated_at
    BEFORE UPDATE ON shift_options
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_individual_shifts_updated_at
    BEFORE UPDATE ON individual_shifts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_swap_requests_updated_at
    BEFORE UPDATE ON shift_swap_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE shift_options IS 'Predefined shift options that can be assigned to employees';
COMMENT ON COLUMN shift_options.category IS 'The category of the shift (early, day, swing, graveyard)';
COMMENT ON COLUMN shift_options.duration_hours IS 'The length of the shift in hours (must be between 1 and 12)';
COMMENT ON TABLE shifts IS 'Stores individual shift instances that can be assigned to employees';
COMMENT ON COLUMN shifts.shift_category IS 'The category of the shift (early, day, swing, graveyard)';
COMMENT ON COLUMN shifts.shift_option_id IS 'Reference to the shift option template this shift was created from';

-- Add RLS policies
ALTER TABLE shift_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;

-- Policies for shift_options
CREATE POLICY "Shift options are viewable by all authenticated users"
    ON shift_options FOR SELECT
    TO authenticated
    USING (true);

-- Policies for schedules
CREATE POLICY "Schedules are viewable by all authenticated users"
    ON schedules FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only managers can create and update schedules"
    ON schedules FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE id = auth.uid() AND role = 'manager'
        )
    );

-- Policies for individual_shifts
CREATE POLICY "Users can view their own shifts and supervisors can view all shifts"
    ON individual_shifts FOR SELECT
    TO authenticated
    USING (
        employee_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM employees
            WHERE id = auth.uid() AND role IN ('supervisor', 'manager')
        )
    );

-- Policies for shift_swap_requests
CREATE POLICY "Users can view swap requests they're involved in"
    ON shift_swap_requests FOR SELECT
    TO authenticated
    USING (
        requester_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM individual_shifts
            WHERE id IN (requested_shift_id, offered_shift_id)
            AND employee_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM employees
            WHERE id = auth.uid() AND role IN ('supervisor', 'manager')
        )
    );

-- Create function to generate schedule
CREATE OR REPLACE FUNCTION generate_schedule(
    start_date DATE,
    end_date DATE,
    employee_ids UUID[],
    shift_option_ids UUID[],
    respect_time_off BOOLEAN,
    respect_weekly_hours BOOLEAN
) RETURNS UUID AS $$
DECLARE
    schedule_id UUID;
BEGIN
    -- Create new schedule
    INSERT INTO schedules (start_date, end_date)
    VALUES (start_date, end_date)
    RETURNING id INTO schedule_id;

    -- TODO: Implement schedule generation logic
    -- This is a placeholder that will need to be replaced with actual scheduling algorithm

    RETURN schedule_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate schedule
CREATE OR REPLACE FUNCTION validate_schedule(
    p_schedule_id UUID
) RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    -- TODO: Implement schedule validation logic
    -- This is a placeholder that will need to be replaced with actual validation logic
    
    result = jsonb_build_object(
        'is_valid', true,
        'violations', '[]'::jsonb
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql'; 