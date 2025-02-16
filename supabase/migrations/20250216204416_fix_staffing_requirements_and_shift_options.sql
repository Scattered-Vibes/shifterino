-- Create shift_category enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.shift_category AS ENUM (
        'early',
        'day',
        'swing',
        'graveyard'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add category column to shift_options if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.shift_options
    ADD COLUMN category public.shift_category;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create shift_options table if it doesn't exist
DO $$ BEGIN
    CREATE TABLE IF NOT EXISTS public.shift_options (
        id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
        name text NOT NULL,
        start_time time without time zone NOT NULL,
        end_time time without time zone NOT NULL,
        duration_hours numeric(4,2) NOT NULL,
        category public.shift_category NOT NULL,
        is_overnight boolean DEFAULT false NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        created_by uuid REFERENCES auth.users(id),
        updated_by uuid REFERENCES auth.users(id),
        CONSTRAINT valid_duration CHECK (duration_hours > 0 AND duration_hours <= 12)
    );
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Add day_of_week to staffing_requirements if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.staffing_requirements
    ADD COLUMN day_of_week smallint;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add constraint if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.staffing_requirements
    ADD CONSTRAINT valid_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add indexes for better query performance (will be skipped if they exist)
CREATE INDEX IF NOT EXISTS idx_shift_options_category ON public.shift_options(category);
CREATE INDEX IF NOT EXISTS idx_staffing_requirements_day ON public.staffing_requirements(day_of_week);

-- Add RLS policies (will be skipped if they exist)
ALTER TABLE public.shift_options ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Enable read access for all users" ON public.shift_options
        FOR SELECT
        USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Enable insert for authenticated users only" ON public.shift_options
        FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Enable update for managers only" ON public.shift_options
        FOR UPDATE
        USING (public.check_user_role(ARRAY['manager']))
        WITH CHECK (public.check_user_role(ARRAY['manager']));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Enable delete for managers only" ON public.shift_options
        FOR DELETE
        USING (public.check_user_role(ARRAY['manager']));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant necessary permissions
GRANT ALL ON public.shift_options TO authenticated;
GRANT ALL ON public.shift_options TO service_role;
