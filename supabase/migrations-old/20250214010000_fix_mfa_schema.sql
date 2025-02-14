-- Fix MFA schema configuration
DO $$
BEGIN
    -- Ensure auth schema exists
    CREATE SCHEMA IF NOT EXISTS auth;

    -- Add factor_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'auth'
        AND table_name = 'mfa_factors'
        AND column_name = 'factor_type'
    ) THEN
        ALTER TABLE auth.mfa_factors ADD COLUMN factor_type text;
    END IF;

    -- Grant necessary permissions
    GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
    GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated;
END $$; 