-- Re-enable RLS on auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Policy for service_role to read all records
CREATE POLICY "Service role can read all records"
ON auth.users
FOR ALL
TO service_role
USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT SELECT ON auth.users TO anon, authenticated, service_role;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA auth TO anon, authenticated, service_role; 