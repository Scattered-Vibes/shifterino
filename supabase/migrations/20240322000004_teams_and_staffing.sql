-- Create teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT teams_name_unique UNIQUE (name)
);

-- Create shift options table
CREATE TABLE shift_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category shift_category NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours INTEGER NOT NULL CHECK (duration_hours > 0 AND duration_hours <= 12),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT shift_options_name_unique UNIQUE (name)
);

-- Create staffing requirements table
CREATE TABLE staffing_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    min_employees INTEGER NOT NULL CHECK (min_employees > 0),
    min_supervisors INTEGER NOT NULL DEFAULT 1 CHECK (min_supervisors > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT staffing_requirements_team_time_unique UNIQUE (team_id, start_time, end_time)
);

-- Add foreign key to employees table for team_id
ALTER TABLE employees
ADD CONSTRAINT employees_team_fk
FOREIGN KEY (team_id)
REFERENCES teams(id)
ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_shift_options_category ON shift_options(category);
CREATE INDEX idx_shift_options_duration ON shift_options(duration_hours);
CREATE INDEX idx_staffing_requirements_team ON staffing_requirements(team_id);
CREATE INDEX idx_staffing_requirements_time ON staffing_requirements(start_time, end_time);

-- Create triggers for updated_at
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_options_updated_at
    BEFORE UPDATE ON shift_options
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staffing_requirements_updated_at
    BEFORE UPDATE ON staffing_requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE teams IS 'Teams that employees belong to';
COMMENT ON COLUMN teams.name IS 'The name of the team';
COMMENT ON COLUMN teams.description IS 'A description of the team and its purpose';
COMMENT ON TABLE shift_options IS 'Predefined shift options that can be assigned to employees';
COMMENT ON COLUMN shift_options.category IS 'The general time category of the shift (early, day, swing, graveyard)';
COMMENT ON COLUMN shift_options.duration_hours IS 'The length of the shift in hours (must be between 1 and 12)';
COMMENT ON TABLE staffing_requirements IS 'Minimum staffing requirements for each time period';
COMMENT ON COLUMN staffing_requirements.min_employees IS 'Minimum number of employees required during this time period';
COMMENT ON COLUMN staffing_requirements.min_supervisors IS 'Minimum number of supervisors required during this time period'; 