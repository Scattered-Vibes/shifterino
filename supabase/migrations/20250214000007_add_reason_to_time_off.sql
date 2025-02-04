-- Add reason column to time_off_requests table as nullable first
ALTER TABLE public.time_off_requests ADD COLUMN reason TEXT;

-- Backfill existing rows with a default reason
UPDATE public.time_off_requests SET reason = 'Time off request' WHERE reason IS NULL;

-- Now make the column NOT NULL
ALTER TABLE public.time_off_requests ALTER COLUMN reason SET NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.time_off_requests.reason IS 'The reason for the time off request'; 