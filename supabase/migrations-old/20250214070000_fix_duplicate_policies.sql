-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own record" ON auth.users;
DROP POLICY IF EXISTS "Public can read allowed user fields" ON auth.users;

-- Create new policies
CREATE POLICY "Users can read own record"
ON auth.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Public can read allowed user fields"
ON auth.users
FOR SELECT
TO anon
USING (true);

-- Grant necessary permissions
GRANT SELECT ON auth.users TO anon;
GRANT SELECT ON auth.users TO authenticated; 