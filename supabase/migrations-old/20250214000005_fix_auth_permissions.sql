-- Fix permissions for auth schema and users table
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, supabase_auth_admin;

-- Ensure the auth.users table has correct permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.users TO supabase_auth_admin;

-- Grant specific permissions to other roles
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO service_role;

-- Reset search path to ensure consistency
SET search_path TO public, auth, extensions;

-- Recreate the trigger with proper permissions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 