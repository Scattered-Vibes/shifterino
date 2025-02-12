-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Create rate_limits table for tracking API rate limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id text PRIMARY KEY,
    count integer NOT NULL DEFAULT 1,
    last_request timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT valid_count CHECK (count >= 0)
);

-- Add RLS policies
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
GRANT ALL ON TABLE public.rate_limits TO authenticated;
GRANT ALL ON TABLE public.rate_limits TO service_role;

-- Add updated_at trigger
CREATE TRIGGER update_rate_limits_updated_at
    BEFORE UPDATE ON public.rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits() RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS $$
BEGIN
    -- Delete rate limit entries older than 1 hour
    DELETE FROM public.rate_limits
    WHERE updated_at < (CURRENT_TIMESTAMP - INTERVAL '1 hour');
END;
$$;

-- Create a scheduled job to cleanup old rate limit entries
SELECT cron.schedule(
    'cleanup-rate-limits',
    '*/10 * * * *', -- Run every 10 minutes
    $$SELECT public.cleanup_rate_limits()$$
); 