-- Fix auth schema permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated;

-- Ensure auth.users has correct permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.users TO postgres;
GRANT SELECT ON auth.users TO anon, authenticated;

-- Grant specific permissions to service_role
GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO service_role;

-- Reset search path for consistency
ALTER DATABASE postgres SET search_path TO public, auth, extensions;
ALTER ROLE authenticator SET search_path TO public, auth, extensions;
ALTER ROLE anon SET search_path TO public, auth, extensions;
ALTER ROLE authenticated SET search_path TO public, auth, extensions;
ALTER ROLE service_role SET search_path TO public, auth, extensions;

-- Ensure RLS is enabled on auth.sessions
ALTER TABLE IF EXISTS auth.sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for auth.sessions
DROP POLICY IF EXISTS "Users can only access own sessions" ON auth.sessions;
CREATE POLICY "Users can only access own sessions" ON auth.sessions
    FOR ALL
    USING (auth.uid() = user_id); 