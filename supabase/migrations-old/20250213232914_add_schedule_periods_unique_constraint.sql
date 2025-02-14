-- Add unique constraint to schedule_periods table
ALTER TABLE public.schedule_periods
ADD CONSTRAINT unique_schedule_period_dates 
UNIQUE (start_date, end_date);

-- Update seed file to use the new constraint
ALTER TABLE public.schedule_periods
DROP CONSTRAINT IF EXISTS schedule_periods_pkey CASCADE;

ALTER TABLE public.schedule_periods
ADD CONSTRAINT schedule_periods_pkey PRIMARY KEY (id); 