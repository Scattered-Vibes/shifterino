-- Create the btree_gist extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add exclusion constraint to prevent overlapping schedule periods
ALTER TABLE public.schedule_periods
ADD CONSTRAINT no_overlapping_periods
EXCLUDE USING gist (
    daterange(start_date, end_date, '[]') WITH &&
);

-- Add index to improve query performance on date ranges
CREATE INDEX idx_schedule_periods_date_range 
ON public.schedule_periods 
USING gist (daterange(start_date, end_date, '[]')); 