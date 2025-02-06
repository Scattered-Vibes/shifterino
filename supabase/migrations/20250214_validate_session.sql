-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.validate_session(text);
DROP FUNCTION IF EXISTS public.validate_session(uuid);
DROP FUNCTION IF EXISTS public.validate_session(json);

-- Create new validate_session function
CREATE OR REPLACE FUNCTION public.validate_session(session_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  session_id uuid;
BEGIN
  -- Extract session_id from the session token
  -- In practice, this would validate the JWT and extract the session ID
  -- For now, we'll just check if the session exists in auth.sessions
  BEGIN
    session_id := session_token::uuid;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error if in development
    IF current_setting('app.settings.environment', TRUE) = 'development' THEN
      RAISE NOTICE 'Invalid session token format: %', session_token;
    END IF;
    RETURN false;
  END;

  -- Verify session exists and is valid
  RETURN EXISTS (
    SELECT 1
    FROM auth.sessions s
    WHERE s.id = session_id
      AND (s.not_after IS NULL OR s.not_after > now())
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_session(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_session(text) TO service_role;

-- Create index to optimize session lookups
CREATE INDEX IF NOT EXISTS idx_auth_sessions_id ON auth.sessions(id);

COMMENT ON FUNCTION public.validate_session(text) IS 'Validates a session token and returns true if the session is valid'; 