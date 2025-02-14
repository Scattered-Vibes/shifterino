-- Create auth schema enums
DO $$ BEGIN
    CREATE TYPE auth.aal_level AS ENUM ('aal1', 'aal2', 'aal3');
    CREATE TYPE auth.factor_type AS ENUM ('totp', 'webauthn');
    CREATE TYPE auth.factor_status AS ENUM ('unverified', 'verified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop and recreate the columns with proper types
ALTER TABLE auth.mfa_factors DROP COLUMN IF EXISTS factor_type;
ALTER TABLE auth.mfa_factors DROP COLUMN IF EXISTS status;

ALTER TABLE auth.mfa_factors ADD COLUMN factor_type auth.factor_type;
ALTER TABLE auth.mfa_factors ADD COLUMN status auth.factor_status;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin;

GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA auth TO anon, authenticated; 