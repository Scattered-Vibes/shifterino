-- Add weekly_hours column to employees table
ALTER TABLE public.employees
ADD COLUMN weekly_hours integer NOT NULL DEFAULT 40;

-- Add constraints
ALTER TABLE public.employees
ADD CONSTRAINT weekly_hours_check CHECK (weekly_hours >= 0 AND weekly_hours <= 168);

-- Update existing records
UPDATE public.employees
SET weekly_hours = 40
WHERE weekly_hours IS NULL; 