-- Create staffing requirements table with proper schema
CREATE TABLE staffing_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time_block_start TIME NOT NULL,
    time_block_end TIME NOT NULL,
    min_employees INTEGER NOT NULL CHECK (min_employees >= 0),
    requires_supervisor BOOLEAN NOT NULL DEFAULT true,
    crosses_midnight BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT staffing_requirements_time_check CHECK (
        (crosses_midnight = false AND time_block_end > time_block_start) OR
        (crosses_midnight = true AND time_block_end < time_block_start)
    )
);

-- Create indexes
CREATE INDEX idx_staffing_requirements_time ON staffing_requirements(time_block_start, time_block_end);

-- Create triggers for updated_at
CREATE TRIGGER update_staffing_requirements_updated_at
    BEFORE UPDATE ON staffing_requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE staffing_requirements ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Staffing requirements are viewable by all authenticated users"
    ON staffing_requirements FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only managers can modify staffing requirements"
    ON staffing_requirements FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE id = auth.uid() AND role = 'manager'
        )
    );

-- Add comments
COMMENT ON TABLE staffing_requirements IS 'Defines minimum staffing requirements for different time blocks';
COMMENT ON COLUMN staffing_requirements.time_block_start IS 'Start time of the staffing requirement block';
COMMENT ON COLUMN staffing_requirements.time_block_end IS 'End time of the staffing requirement block';
COMMENT ON COLUMN staffing_requirements.min_employees IS 'Minimum number of employees required during this time block';
COMMENT ON COLUMN staffing_requirements.requires_supervisor IS 'Whether this time block requires at least one supervisor';
COMMENT ON COLUMN staffing_requirements.crosses_midnight IS 'Whether this time block crosses midnight (e.g., 9 PM to 1 AM)';

-- Insert initial staffing requirements
INSERT INTO staffing_requirements (time_block_start, time_block_end, min_employees, requires_supervisor, crosses_midnight)
VALUES 
    ('05:00:00', '09:00:00', 6, true, false),  -- Morning block
    ('09:00:00', '21:00:00', 8, true, false),  -- Day block
    ('21:00:00', '01:00:00', 7, true, true),   -- Evening block (crosses midnight)
    ('01:00:00', '05:00:00', 6, true, false);  -- Night block 