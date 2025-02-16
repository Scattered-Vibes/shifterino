-- Grant necessary permissions to authenticated and anon roles
GRANT USAGE ON SCHEMA auth TO authenticated, anon;

-- Core user table permissions
GRANT SELECT ON auth.users TO authenticated, anon;
GRANT UPDATE (
    last_sign_in_at,
    updated_at,
    email,
    phone,
    email_confirmed_at,
    phone_confirmed_at,
    confirmation_sent_at,
    recovery_sent_at,
    email_change,
    email_change_token_new,
    email_change_token_current,
    email_change_confirm_status,
    reauthentication_sent_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    is_sso_user
) ON auth.users TO authenticated;

-- Auth session management
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.refresh_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.identities TO authenticated;

-- MFA related permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.mfa_factors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.mfa_challenges TO authenticated;

-- SSO related permissions
GRANT SELECT ON auth.sso_providers TO authenticated, anon;
GRANT SELECT ON auth.sso_domains TO authenticated, anon;
GRANT SELECT ON auth.saml_providers TO authenticated, anon;
GRANT SELECT ON auth.saml_relay_states TO authenticated, anon;
GRANT SELECT ON auth.flow_state TO authenticated, anon;

-- Ensure RLS is enabled on employees table
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own employee information
CREATE POLICY "employees_select_own"
    ON public.employees
    FOR SELECT
    USING (auth_id = auth.uid());

-- Allow users to update their own employee information
CREATE POLICY "employees_update_own"
    ON public.employees
    FOR UPDATE
    USING (auth_id = auth.uid())
    WITH CHECK (auth_id = auth.uid());

-- Grant execute permission on auth functions
GRANT EXECUTE ON FUNCTION auth.email() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated; 