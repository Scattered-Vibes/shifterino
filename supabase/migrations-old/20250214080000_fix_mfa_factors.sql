-- Drop and recreate the columns to ensure they're properly added
ALTER TABLE auth.mfa_factors DROP COLUMN IF EXISTS status;
ALTER TABLE auth.mfa_factors DROP COLUMN IF EXISTS factor_type;

-- Add the columns back
ALTER TABLE auth.mfa_factors ADD COLUMN status text;
ALTER TABLE auth.mfa_factors ADD COLUMN factor_type text;

-- Grant necessary permissions
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin; 