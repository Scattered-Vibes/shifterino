-- Add team_id to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS team_id uuid,
ADD COLUMN IF NOT EXISTS preferred_shift_category public.shift_category;

-- Create shift_options table
CREATE TABLE IF NOT EXISTS public.shift_options (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    category public.shift_category NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    duration_hours numeric(4,2) NOT NULL,
    is_overnight boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT valid_duration CHECK (duration_hours > 0 AND duration_hours <= 12)
);

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- Add foreign key constraint for team_id
ALTER TABLE public.employees
ADD CONSTRAINT employees_team_id_fkey 
FOREIGN KEY (team_id) 
REFERENCES public.teams(id) 
ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_employees_team ON public.employees(team_id);
CREATE INDEX IF NOT EXISTS idx_shift_options_category ON public.shift_options(category);

-- Add RLS policies
ALTER TABLE public.shift_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Everyone can read shift options
CREATE POLICY "shift_options_read_all" ON public.shift_options
FOR SELECT USING (true);

-- Only managers can modify shift options
CREATE POLICY "shift_options_modify_managers" ON public.shift_options
USING (public.check_user_role(ARRAY['manager']));

-- Everyone can read teams
CREATE POLICY "teams_read_all" ON public.teams
FOR SELECT USING (true);

-- Only managers can modify teams
CREATE POLICY "teams_modify_managers" ON public.teams
USING (public.check_user_role(ARRAY['manager']));
