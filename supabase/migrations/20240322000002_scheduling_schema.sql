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

CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    shift_type VARCHAR(255),
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_auto_generated BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT shifts_time_check CHECK (start_time < end_time)
);

CREATE TABLE shift_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
    status time_off_request_status NOT NULL DEFAULT 'PENDING',
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
    status shift_swap_status NOT NULL DEFAULT 'PENDING',
    reason TEXT NOT NULL,
    manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
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