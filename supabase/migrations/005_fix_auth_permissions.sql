-- Fix auth permissions for Supabase Auth service
GRANT USAGE ON SCHEMA auth TO service_role, supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role, supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO service_role, supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO service_role, supabase_auth_admin;

-- Ensure auth service can access public schema
GRANT USAGE ON SCHEMA public TO service_role, supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role, supabase_auth_admin;

-- Grant specific permissions for auth.users table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE auth.users TO supabase_auth_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE auth.users TO service_role;

-- Grant permissions for related tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role, supabase_auth_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.employees TO service_role, supabase_auth_admin;

-- Ensure handle_new_user trigger has proper permissions
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role, supabase_auth_admin; 