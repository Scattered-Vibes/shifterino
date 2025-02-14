-- Ensure auth schema exists and has proper permissions
CREATE SCHEMA IF NOT EXISTS auth;

-- Grant usage on auth schema
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Grant permissions on auth schema objects
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres, service_role;

-- Grant specific permissions to anon and authenticated roles
GRANT SELECT ON TABLE auth.users TO anon, authenticated;
GRANT SELECT ON TABLE auth.refresh_tokens TO anon, authenticated;
GRANT SELECT ON TABLE auth.sessions TO anon, authenticated;
GRANT SELECT ON TABLE auth.mfa_factors TO anon, authenticated;
GRANT SELECT ON TABLE auth.mfa_challenges TO anon, authenticated;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO anon, authenticated;

-- Ensure the trigger function has proper permissions
ALTER FUNCTION public.handle_auth_user_created() SECURITY DEFINER;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_created(); 