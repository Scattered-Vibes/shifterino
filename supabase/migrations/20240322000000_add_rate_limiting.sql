-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Create rate limits table with proper indexes and RLS
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id text PRIMARY KEY,
    count integer NOT NULL DEFAULT 0,
    last_request timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_last_request ON public.rate_limits (last_request);
CREATE INDEX IF NOT EXISTS idx_rate_limits_created_at ON public.rate_limits (created_at);

-- Add RLS policies
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow the service role to access this table
CREATE POLICY "service_role_only" ON public.rate_limits
    FOR ALL
    TO service_role
    USING (true);

-- Create a function to cleanup old rate limit records
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.rate_limits
    WHERE created_at < now() - INTERVAL '1 day';
END;
$$;

-- Create a cron job to cleanup old records daily if pg_cron is available
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_extension 
        WHERE extname = 'pg_cron'
    ) THEN
        PERFORM cron.schedule(
            'cleanup-rate-limits',
            '0 0 * * *',
            'SELECT cleanup_rate_limits();'
        );
    END IF;
END $$; 