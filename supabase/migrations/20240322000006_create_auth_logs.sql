-- Create auth_logs table for debugging
CREATE TABLE IF NOT EXISTS auth_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level TEXT NOT NULL,
    event TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    session_id UUID,
    context JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_auth_logs_timestamp ON auth_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_level ON auth_logs(level);

-- Add RLS policies
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Only allow insert from authenticated users
CREATE POLICY "Enable insert for authenticated users only"
ON auth_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow read access for admins only
CREATE POLICY "Enable read for admins only"
ON auth_logs FOR SELECT TO authenticated
USING (
    auth.jwt() ->> 'role' = 'admin'
);

-- Create function to clean old logs
CREATE OR REPLACE FUNCTION clean_old_auth_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM auth_logs
    WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$; 