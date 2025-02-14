-- Update permissions where possible
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA auth TO anon, authenticated;

-- Ensure RLS is enabled
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Update RLS policies
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON auth.users;
CREATE POLICY "Public users are viewable by everyone"
    ON auth.users FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own users" ON auth.users;
CREATE POLICY "Users can insert their own users"
    ON auth.users FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own user data" ON auth.users;
CREATE POLICY "Users can update own user data"
    ON auth.users FOR UPDATE
    USING (auth.uid() = id);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users(instance_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users(email);
CREATE INDEX IF NOT EXISTS refresh_tokens_token_idx ON auth.refresh_tokens(token);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON auth.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON auth.sessions(user_id);
CREATE INDEX IF NOT EXISTS mfa_factors_user_id_idx ON auth.mfa_factors(user_id);