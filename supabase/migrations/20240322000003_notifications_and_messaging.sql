-- Create notifications and messaging tables
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create system settings and audit logs
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT system_settings_unique UNIQUE (organization_id, key)
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    record_id UUID,
    changed_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scheduled_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    report_type VARCHAR(255) NOT NULL,
    report_parameters JSONB,
    schedule_cron VARCHAR(255) NOT NULL,
    recipients TEXT[] NOT NULL,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT scheduled_reports_recipients_not_empty CHECK (array_length(recipients, 1) > 0)
);

-- Create function to create notification on time-off request status change
CREATE OR REPLACE FUNCTION create_time_off_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO notifications (
            user_id,
            type,
            message,
            data
        )
        VALUES (
            NEW.employee_id,
            'time_off_request',
            CASE 
                WHEN NEW.status = 'approved' THEN 'Your time-off request has been approved'
                WHEN NEW.status = 'rejected' THEN 'Your time-off request has been rejected'
                ELSE 'Your time-off request status has been updated'
            END,
            jsonb_build_object(
                'request_id', NEW.id,
                'start_date', NEW.start_date,
                'end_date', NEW.end_date,
                'status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for time-off notifications
CREATE TRIGGER time_off_notification_trigger
    AFTER UPDATE OF status ON time_off_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_time_off_notification();

-- Create indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_messages_from_user ON messages(from_user_id);
CREATE INDEX idx_messages_to_user ON messages(to_user_id);
CREATE INDEX idx_messages_composite ON messages(from_user_id, to_user_id, created_at);
CREATE INDEX idx_system_settings_org ON system_settings(organization_id);
CREATE INDEX idx_system_settings_key ON system_settings(key);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_scheduled_reports_org ON scheduled_reports(organization_id);
CREATE INDEX idx_scheduled_reports_active ON scheduled_reports(is_active);

-- Create triggers for updated_at
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at
    BEFORE UPDATE ON scheduled_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE system_settings IS 'Stores both global (organization_id = NULL) and organization-specific settings. Organization-specific settings take precedence over global settings when both exist.';
COMMENT ON TABLE audit_logs IS 'Tracks changes to database records. changed_data JSONB should contain both before and after states in the format: {"before": {}, "after": {}, "summary": "text description"}'; 