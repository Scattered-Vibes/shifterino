-- Drop existing policies
DROP POLICY IF EXISTS "Public can read allowed user fields" ON auth.users;
DROP POLICY IF EXISTS "Users can read own record" ON auth.users;

-- Create new policies without WITH CHECK for SELECT
CREATE POLICY "Public can read allowed user fields"
ON auth.users
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Users can read own record"
ON auth.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Grant necessary permissions
GRANT SELECT ON auth.users TO anon;
GRANT SELECT ON auth.users TO authenticated;

-- Fix MFA factors table if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name = 'mfa_factors'
    ) THEN
        ALTER TABLE auth.mfa_factors ADD COLUMN IF NOT EXISTS status text;
    END IF;
END
$$; 