-- Fix auth permissions
-- This migration ensures all necessary permissions are granted for the auth system

-- First, ensure proper schema usage
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO authenticated;

-- Ensure service_role has necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO service_role;

-- Ensure handle_new_user trigger has proper permissions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permission on handle_new_user function
GRANT EXECUTE ON FUNCTION public.handle_new_user TO authenticated, anon, service_role;

-- Reset search path to ensure consistency
SET search_path TO public, auth, extensions;

-- Ensure proper session management
GRANT ALL ON auth.sessions TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.validate_session TO service_role;

-- Add specific RLS policy for auth.sessions
DROP POLICY IF EXISTS "Users can only access their own sessions" ON auth.sessions;
CREATE POLICY "Users can only access their own sessions"
  ON auth.sessions
  FOR ALL
  USING (auth.uid() = user_id); 