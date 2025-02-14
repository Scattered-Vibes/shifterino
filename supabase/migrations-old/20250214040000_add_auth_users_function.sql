-- Create function to get auth users
CREATE OR REPLACE FUNCTION get_auth_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email::text, u.created_at
  FROM auth.users u
  LIMIT 5;
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION get_auth_users() TO service_role; 