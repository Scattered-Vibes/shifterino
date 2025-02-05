-- Enable required extensions for JWT support
CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Ensure auth schema exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.secrets table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.secrets (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    secret text NOT NULL,
    key_id uuid NOT NULL DEFAULT gen_random_uuid(),
    key_salt text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create auth.jwt() function if it doesn't exist
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
    SELECT 
        coalesce(
            nullif(current_setting('request.jwt.claim', true), ''),
            nullif(current_setting('request.jwt.claims', true), '')
        )::jsonb;
$$;

-- Create auth.role() function if it doesn't exist
CREATE OR REPLACE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
    SELECT 
        coalesce(
            nullif(current_setting('request.jwt.claim.role', true), ''),
            nullif(current_setting('request.jwt.claims.role', true), '')
        )::text;
$$;

-- Ensure proper access to JWT functions
GRANT EXECUTE ON FUNCTION auth.jwt() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated, service_role;

-- Grant usage on required schemas
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO anon, authenticated, service_role;

-- Set proper ownership and permissions for secrets table
ALTER TABLE auth.secrets OWNER TO supabase_auth_admin;
GRANT ALL ON auth.secrets TO supabase_auth_admin;
GRANT SELECT ON auth.secrets TO authenticator;

-- Create trigger for secrets updated_at
CREATE OR REPLACE FUNCTION auth.secrets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS secrets_updated_at ON auth.secrets;
CREATE TRIGGER secrets_updated_at
    BEFORE UPDATE ON auth.secrets
    FOR EACH ROW
    EXECUTE FUNCTION auth.secrets_updated_at();

-- Set the JWT secret to match the auth service configuration
DELETE FROM auth.secrets WHERE name = 'jwt_secret';
INSERT INTO auth.secrets (name, secret)
VALUES ('jwt_secret', 'super-secret-jwt-token-with-at-least-32-characters-long');

-- Grant JWT generation permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO authenticator, anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO authenticator, anon, authenticated; 