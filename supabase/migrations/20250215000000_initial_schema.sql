-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "btree_gist" WITH SCHEMA extensions;

-- Create custom types
DO $$ BEGIN
    CREATE TYPE public.employee_role AS ENUM ('dispatcher', 'supervisor', 'manager');
    CREATE TYPE public.shift_pattern AS ENUM ('4_10', '3_12_4');
    CREATE TYPE public.shift_category AS ENUM ('DAY', 'SWING', 'NIGHT');
    CREATE TYPE public.time_off_status AS ENUM ('pending', 'approved', 'rejected');
    CREATE TYPE public.shift_status AS ENUM ('scheduled', 'completed', 'cancelled');
    CREATE TYPE public.schedule_status AS ENUM ('draft', 'published', 'archived');
    CREATE TYPE public.swap_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
    CREATE TYPE public.on_call_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
    CREATE TYPE public.holiday_type AS ENUM ('FEDERAL', 'COMPANY', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Core tables
CREATE TABLE IF NOT EXISTS public.employees (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email text NOT NULL UNIQUE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    role public.employee_role NOT NULL DEFAULT 'dispatcher',
    shift_pattern public.shift_pattern NOT NULL DEFAULT '4_10',
    weekly_hours_cap integer NOT NULL DEFAULT 40,
    max_overtime_hours integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.shifts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.staffing_requirements (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_time time NOT NULL,
    end_time time NOT NULL,
    min_total_staff integer NOT NULL,
    min_supervisors integer NOT NULL DEFAULT 1,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT valid_staff_count CHECK (min_total_staff >= min_supervisors),
    CONSTRAINT valid_time_range CHECK (start_time != end_time)
);

CREATE TABLE IF NOT EXISTS public.assigned_shifts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    shift_id uuid NOT NULL REFERENCES public.shifts(id),
    date date NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT unique_employee_shift_date UNIQUE (employee_id, date)
);

CREATE TABLE IF NOT EXISTS public.time_off_requests (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status public.time_off_status NOT NULL DEFAULT 'pending',
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Add schedule_periods table
CREATE TABLE IF NOT EXISTS public.schedule_periods (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_date date NOT NULL,
    end_date date NOT NULL,
    status public.schedule_status NOT NULL DEFAULT 'draft',
    description text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_employees_auth_id ON public.employees(auth_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);
CREATE INDEX IF NOT EXISTS idx_assigned_shifts_date ON public.assigned_shifts(date);
CREATE INDEX IF NOT EXISTS idx_assigned_shifts_employee ON public.assigned_shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_employee ON public.time_off_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_dates ON public.time_off_requests USING gist (
    employee_id,
    daterange(start_date, end_date, '[]')
);

-- Functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.set_updated_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_shift_overlap()
RETURNS TRIGGER AS $$
DECLARE
    shift_start timestamp;
    shift_end timestamp;
    existing_shift RECORD;
BEGIN
    -- Get the shift times for the new assignment
    SELECT 
        (NEW.date + start_time)::timestamp AS start_ts,
        CASE 
            WHEN end_time <= start_time THEN (NEW.date + interval '1 day' + end_time)::timestamp
            ELSE (NEW.date + end_time)::timestamp
        END AS end_ts
    INTO shift_start, shift_end
    FROM public.shifts
    WHERE id = NEW.shift_id;

    -- Check for overlapping shifts
    FOR existing_shift IN
        SELECT s.start_time, s.end_time, a.date
        FROM public.assigned_shifts a
        JOIN public.shifts s ON s.id = a.shift_id
        WHERE a.employee_id = NEW.employee_id
        AND a.date BETWEEN (NEW.date - interval '1 day') AND (NEW.date + interval '1 day')
        AND a.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    LOOP
        IF (shift_start, shift_end) OVERLAPS 
           ((existing_shift.date + existing_shift.start_time)::timestamp,
            CASE 
                WHEN existing_shift.end_time <= existing_shift.start_time 
                THEN (existing_shift.date + interval '1 day' + existing_shift.end_time)::timestamp
                ELSE (existing_shift.date + existing_shift.end_time)::timestamp
            END)
        THEN
            RAISE EXCEPTION 'Shift overlaps with existing assignment';
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name text;
  v_last_name text;
  v_role public.employee_role;
  v_shift_pattern public.shift_pattern;
  v_metadata jsonb;
BEGIN
  -- First try app_metadata, then fall back to user_metadata if needed
  v_metadata := COALESCE(NEW.raw_app_meta_data, NEW.raw_user_meta_data, '{}'::jsonb);
  
  -- Extract user metadata with proper error handling and logging
  BEGIN
    -- Get first name with detailed logging
    v_first_name := v_metadata->>'first_name';
    IF v_first_name IS NULL OR v_first_name = '' THEN
      v_first_name := split_part(NEW.email, '@', 1);
      RAISE WARNING 'Using email prefix for first_name: %', v_first_name;
    END IF;
    
    -- Get last name with detailed logging
    v_last_name := v_metadata->>'last_name';
    IF v_last_name IS NULL OR v_last_name = '' THEN
      v_last_name := '';
      RAISE WARNING 'No last_name provided for user: %', NEW.email;
    END IF;
    
    -- Get role with validation
    BEGIN
      v_role := (v_metadata->>'role')::public.employee_role;
    EXCEPTION WHEN OTHERS THEN
      v_role := 'dispatcher';
      RAISE WARNING 'Invalid role for user %, defaulting to dispatcher', NEW.email;
    END;
    
    -- Get shift pattern with validation
    BEGIN
      v_shift_pattern := (v_metadata->>'shift_pattern')::public.shift_pattern;
    EXCEPTION WHEN OTHERS THEN
      v_shift_pattern := '4_10';
      RAISE WARNING 'Invalid shift_pattern for user %, defaulting to 4_10', NEW.email;
    END;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log error and use defaults
    RAISE WARNING 'Error processing user metadata for %: %', NEW.email, SQLERRM;
    v_first_name := split_part(NEW.email, '@', 1);
    v_last_name := '';
    v_role := 'dispatcher';
    v_shift_pattern := '4_10';
  END;

  -- Create employee record with atomic operation
  INSERT INTO public.employees (
    auth_id,
    email,
    first_name,
    last_name,
    role,
    shift_pattern,
    weekly_hours_cap,
    max_overtime_hours
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_role,
    v_shift_pattern,
    40,
    0
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    shift_pattern = EXCLUDED.shift_pattern,
    updated_at = now();

  -- Set profile_incomplete flag if necessary
  IF v_first_name = split_part(NEW.email, '@', 1) OR v_last_name = '' THEN
    -- Log the reason for incomplete profile
    RAISE WARNING 'Profile marked as incomplete for %: first_name_is_email=%, last_name_empty=%',
      NEW.email,
      v_first_name = split_part(NEW.email, '@', 1),
      v_last_name = '';
      
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{profile_incomplete}',
      'true'::jsonb
    )
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log any errors but don't prevent user creation
  RAISE WARNING 'Error in handle_auth_user_created for %: %', NEW.email, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions to the trigger function
GRANT EXECUTE ON FUNCTION public.handle_auth_user_created TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_auth_user_created TO service_role;

-- Note: The on_auth_user_created trigger is created in 20250213132902_update_user_created_trigger.sql

-- Other triggers
CREATE OR REPLACE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_employees_created_by
    BEFORE INSERT ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

CREATE OR REPLACE TRIGGER set_employees_updated_by
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

CREATE OR REPLACE TRIGGER update_shifts_updated_at
    BEFORE UPDATE ON public.shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER check_shift_overlap_insert
    BEFORE INSERT ON public.assigned_shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.check_shift_overlap();

CREATE OR REPLACE TRIGGER check_shift_overlap_update
    BEFORE UPDATE ON public.assigned_shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.check_shift_overlap();

-- Function to securely check user role
CREATE OR REPLACE FUNCTION public.check_user_role(required_roles text[])
RETURNS boolean AS $$
DECLARE
    user_role public.employee_role;
BEGIN
    WITH RECURSIVE user_check AS (
        SELECT role
        FROM public.employees
        WHERE auth_id = auth.uid()
        LIMIT 1
    )
    SELECT role INTO user_role
    FROM user_check;

    RETURN user_role::text = ANY(required_roles);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission on the role check function
GRANT EXECUTE ON FUNCTION public.check_user_role(text[]) TO authenticated;

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staffing_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;

-- Basic policy for employees to view their own data
CREATE POLICY "employees_self_access"
    ON public.employees
    FOR SELECT
    USING (auth_id = auth.uid());

-- Allow employee creation
CREATE POLICY "allow_insert"
    ON public.employees
    FOR INSERT
    WITH CHECK (true);

-- Policy for supervisors and managers to view all employees
CREATE POLICY "supervisors_managers_view_all"
    ON public.employees
    FOR SELECT
    USING (public.check_user_role(ARRAY['supervisor', 'manager']));

-- Policy for managers to update any employee
CREATE POLICY "managers_manage_all"
    ON public.employees
    FOR UPDATE
    USING (public.check_user_role(ARRAY['manager']))
    WITH CHECK (public.check_user_role(ARRAY['manager']));

-- Simple policies for other tables
CREATE POLICY "all_view_shifts"
    ON public.shifts
    FOR SELECT
    USING (true);

CREATE POLICY "managers_manage_shifts"
    ON public.shifts
    FOR ALL
    USING (public.check_user_role(ARRAY['manager']));

CREATE POLICY "all_view_staffing_requirements"
    ON public.staffing_requirements
    FOR SELECT
    USING (true);

CREATE POLICY "managers_manage_staffing"
    ON public.staffing_requirements
    FOR ALL
    USING (public.check_user_role(ARRAY['manager']));

-- Assigned shifts policies
CREATE POLICY "view_own_shifts"
    ON public.assigned_shifts
    FOR SELECT
    USING (
        employee_id IN (
            SELECT id
            FROM public.employees
            WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "supervisors_view_all_shifts"
    ON public.assigned_shifts
    FOR SELECT
    USING (public.check_user_role(ARRAY['supervisor', 'manager']));

CREATE POLICY "managers_manage_shifts_assignments"
    ON public.assigned_shifts
    FOR ALL
    USING (public.check_user_role(ARRAY['manager']));

-- Time off request policies
CREATE POLICY "view_own_time_off"
    ON public.time_off_requests
    FOR SELECT
    USING (
        employee_id IN (
            SELECT id
            FROM public.employees
            WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "create_own_time_off"
    ON public.time_off_requests
    FOR INSERT
    WITH CHECK (
        employee_id IN (
            SELECT id
            FROM public.employees
            WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "supervisors_view_all_time_off"
    ON public.time_off_requests
    FOR SELECT
    USING (public.check_user_role(ARRAY['supervisor', 'manager']));

CREATE POLICY "managers_manage_time_off"
    ON public.time_off_requests
    FOR ALL
    USING (public.check_user_role(ARRAY['manager']));

-- Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 