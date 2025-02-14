-- Add status column to mfa_factors table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'mfa_factors' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE auth.mfa_factors ADD COLUMN status text;
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON auth.mfa_factors TO postgres, authenticated, anon, service_role;
GRANT USAGE ON SCHEMA auth TO postgres, authenticated, anon, service_role;

-- Create index on status column
CREATE INDEX IF NOT EXISTS mfa_factors_status_idx ON auth.mfa_factors(status); 