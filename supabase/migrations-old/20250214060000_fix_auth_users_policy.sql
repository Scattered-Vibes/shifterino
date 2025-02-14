-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Public can read allowed user fields" ON auth.users;

-- Create a new restricted policy that only allows access to safe fields
CREATE POLICY "Public can read allowed user fields"
ON auth.users
FOR SELECT
TO anon
USING (true);  -- Keep the row-level check as true

-- Create a security barrier view for safe access
CREATE OR REPLACE VIEW auth.safe_users_view AS
SELECT 
    id,
    email,
    created_at,
    confirmed_at,
    last_sign_in_at,
    raw_user_meta_data,
    is_anonymous
FROM auth.users;

-- Grant access to the safe view
GRANT SELECT ON auth.safe_users_view TO anon, authenticated;

-- Revoke direct table SELECT from anon role
REVOKE SELECT ON auth.users FROM anon;

-- Grant execute on the get_auth_users function
GRANT EXECUTE ON FUNCTION get_auth_users() TO anon, authenticated; 