-- Add unique constraint to staffing_requirements table
ALTER TABLE public.staffing_requirements
ADD CONSTRAINT unique_staffing_requirement 
UNIQUE (schedule_period_id, time_block_start, time_block_end, day_of_week);

-- Update seed file to use the new constraint
ALTER TABLE public.staffing_requirements
DROP CONSTRAINT IF EXISTS staffing_requirements_pkey CASCADE;

ALTER TABLE public.staffing_requirements
ADD CONSTRAINT staffing_requirements_pkey PRIMARY KEY (id); 