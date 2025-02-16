drop trigger if exists "set_individual_shifts_created_by" on "public"."individual_shifts";

drop trigger if exists "set_individual_shifts_updated_by" on "public"."individual_shifts";

drop trigger if exists "update_individual_shifts_updated_at" on "public"."individual_shifts";

-- Safely drop policies if they exist
DO $$ BEGIN
    -- Drop policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'employees_select_own' AND tablename = 'employees') THEN
        DROP POLICY "employees_select_own" ON "public"."employees";
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'employees_update_own' AND tablename = 'employees') THEN
        DROP POLICY "employees_update_own" ON "public"."employees";
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'shift_options_modify_managers' AND tablename = 'shift_options') THEN
        DROP POLICY "shift_options_modify_managers" ON "public"."shift_options";
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'shift_options_read_all' AND tablename = 'shift_options') THEN
        DROP POLICY "shift_options_read_all" ON "public"."shift_options";
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'teams_modify_managers' AND tablename = 'teams') THEN
        DROP POLICY "teams_modify_managers" ON "public"."teams";
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'teams_read_all' AND tablename = 'teams') THEN
        DROP POLICY "teams_read_all" ON "public"."teams";
    END IF;
END $$;

revoke delete on table "public"."individual_shifts" from "anon";

revoke insert on table "public"."individual_shifts" from "anon";

revoke references on table "public"."individual_shifts" from "anon";

revoke select on table "public"."individual_shifts" from "anon";

revoke trigger on table "public"."individual_shifts" from "anon";

revoke truncate on table "public"."individual_shifts" from "anon";

revoke update on table "public"."individual_shifts" from "anon";

revoke delete on table "public"."individual_shifts" from "authenticated";

revoke insert on table "public"."individual_shifts" from "authenticated";

revoke references on table "public"."individual_shifts" from "authenticated";

revoke select on table "public"."individual_shifts" from "authenticated";

revoke trigger on table "public"."individual_shifts" from "authenticated";

revoke truncate on table "public"."individual_shifts" from "authenticated";

revoke update on table "public"."individual_shifts" from "authenticated";

revoke delete on table "public"."individual_shifts" from "service_role";

revoke insert on table "public"."individual_shifts" from "service_role";

revoke references on table "public"."individual_shifts" from "service_role";

revoke select on table "public"."individual_shifts" from "service_role";

revoke trigger on table "public"."individual_shifts" from "service_role";

revoke truncate on table "public"."individual_shifts" from "service_role";

revoke update on table "public"."individual_shifts" from "service_role";

revoke delete on table "public"."schedule_periods" from "anon";

revoke insert on table "public"."schedule_periods" from "anon";

revoke references on table "public"."schedule_periods" from "anon";

revoke select on table "public"."schedule_periods" from "anon";

revoke trigger on table "public"."schedule_periods" from "anon";

revoke truncate on table "public"."schedule_periods" from "anon";

revoke update on table "public"."schedule_periods" from "anon";

revoke delete on table "public"."schedule_periods" from "authenticated";

revoke insert on table "public"."schedule_periods" from "authenticated";

revoke references on table "public"."schedule_periods" from "authenticated";

revoke select on table "public"."schedule_periods" from "authenticated";

revoke trigger on table "public"."schedule_periods" from "authenticated";

revoke truncate on table "public"."schedule_periods" from "authenticated";

revoke update on table "public"."schedule_periods" from "authenticated";

revoke delete on table "public"."schedule_periods" from "service_role";

revoke insert on table "public"."schedule_periods" from "service_role";

revoke references on table "public"."schedule_periods" from "service_role";

revoke select on table "public"."schedule_periods" from "service_role";

revoke trigger on table "public"."schedule_periods" from "service_role";

revoke truncate on table "public"."schedule_periods" from "service_role";

revoke update on table "public"."schedule_periods" from "service_role";

revoke delete on table "public"."shift_options" from "anon";

revoke insert on table "public"."shift_options" from "anon";

revoke references on table "public"."shift_options" from "anon";

revoke select on table "public"."shift_options" from "anon";

revoke trigger on table "public"."shift_options" from "anon";

revoke truncate on table "public"."shift_options" from "anon";

revoke update on table "public"."shift_options" from "anon";

revoke delete on table "public"."shift_options" from "authenticated";

revoke insert on table "public"."shift_options" from "authenticated";

revoke references on table "public"."shift_options" from "authenticated";

revoke select on table "public"."shift_options" from "authenticated";

revoke trigger on table "public"."shift_options" from "authenticated";

revoke truncate on table "public"."shift_options" from "authenticated";

revoke update on table "public"."shift_options" from "authenticated";

revoke delete on table "public"."shift_options" from "service_role";

revoke insert on table "public"."shift_options" from "service_role";

revoke references on table "public"."shift_options" from "service_role";

revoke select on table "public"."shift_options" from "service_role";

revoke trigger on table "public"."shift_options" from "service_role";

revoke truncate on table "public"."shift_options" from "service_role";

revoke update on table "public"."shift_options" from "service_role";

revoke delete on table "public"."teams" from "anon";

revoke insert on table "public"."teams" from "anon";

revoke references on table "public"."teams" from "anon";

revoke select on table "public"."teams" from "anon";

revoke trigger on table "public"."teams" from "anon";

revoke truncate on table "public"."teams" from "anon";

revoke update on table "public"."teams" from "anon";

revoke delete on table "public"."teams" from "authenticated";

revoke insert on table "public"."teams" from "authenticated";

revoke references on table "public"."teams" from "authenticated";

revoke select on table "public"."teams" from "authenticated";

revoke trigger on table "public"."teams" from "authenticated";

revoke truncate on table "public"."teams" from "authenticated";

revoke update on table "public"."teams" from "authenticated";

revoke delete on table "public"."teams" from "service_role";

revoke insert on table "public"."teams" from "service_role";

revoke references on table "public"."teams" from "service_role";

revoke select on table "public"."teams" from "service_role";

revoke trigger on table "public"."teams" from "service_role";

revoke truncate on table "public"."teams" from "service_role";

revoke update on table "public"."teams" from "service_role";

alter table "public"."employees" drop constraint "employees_team_id_fkey";

alter table "public"."individual_shifts" drop constraint "individual_shifts_assigned_shift_id_fkey";

alter table "public"."individual_shifts" drop constraint "individual_shifts_created_by_fkey";

alter table "public"."individual_shifts" drop constraint "individual_shifts_employee_id_fkey";

alter table "public"."individual_shifts" drop constraint "individual_shifts_updated_by_fkey";

alter table "public"."individual_shifts" drop constraint "valid_hours";

alter table "public"."schedule_periods" drop constraint "schedule_periods_created_by_fkey";

alter table "public"."schedule_periods" drop constraint "schedule_periods_updated_by_fkey";

alter table "public"."schedule_periods" drop constraint "valid_date_range";

alter table "public"."shift_options" drop constraint "shift_options_created_by_fkey";

alter table "public"."shift_options" drop constraint "shift_options_updated_by_fkey";

alter table "public"."shift_options" drop constraint "valid_duration";

alter table "public"."teams" drop constraint "teams_created_by_fkey";

alter table "public"."teams" drop constraint "teams_name_key";

alter table "public"."teams" drop constraint "teams_updated_by_fkey";

alter table "public"."individual_shifts" drop constraint "individual_shifts_pkey";

alter table "public"."schedule_periods" drop constraint "schedule_periods_pkey";

alter table "public"."shift_options" drop constraint "shift_options_pkey";

alter table "public"."teams" drop constraint "teams_pkey";

drop index if exists "public"."idx_employees_team";

drop index if exists "public"."idx_individual_shifts_date";

drop index if exists "public"."idx_individual_shifts_employee";

drop index if exists "public"."idx_individual_shifts_status";

drop index if exists "public"."idx_shift_options_category";

drop index if exists "public"."individual_shifts_pkey";

drop index if exists "public"."schedule_periods_pkey";

drop index if exists "public"."shift_options_pkey";

drop index if exists "public"."teams_name_key";

drop index if exists "public"."teams_pkey";

drop table "public"."individual_shifts";

drop table "public"."schedule_periods";

drop table "public"."shift_options";

drop table "public"."teams";

-- Handle unused enums first
DO $$ 
DECLARE
    enum_type text;
BEGIN
    -- List of enums to drop (only unused ones)
    FOR enum_type IN 
        SELECT unnest(ARRAY[
            'holiday_type',
            'on_call_status',
            'shift_category',
            'swap_request_status'
        ])
    LOOP
        -- Drop any columns using the enum
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE udt_name = enum_type
        ) THEN
            -- Drop the columns that use the enum
            EXECUTE (
                SELECT string_agg(
                    format('ALTER TABLE %I.%I DROP COLUMN %I;',
                        table_schema,
                        table_name,
                        column_name
                    ),
                    E'\n'
                )
                FROM information_schema.columns
                WHERE udt_name = enum_type
            );
        END IF;

        -- Now safe to drop the type
        EXECUTE format('DROP TYPE IF EXISTS "public".%I', enum_type);
    END LOOP;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Ensure required enums exist
DO $$ BEGIN
    CREATE TYPE public.schedule_status AS ENUM ('draft', 'published', 'archived');
    CREATE TYPE public.shift_status AS ENUM ('scheduled', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Recreate tables with updated schema
CREATE TABLE IF NOT EXISTS public.teams (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.shift_options (
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

CREATE TABLE IF NOT EXISTS public.individual_shifts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    assigned_shift_id uuid NOT NULL REFERENCES public.assigned_shifts(id) ON DELETE CASCADE,
    date date NOT NULL,
    actual_hours_worked numeric(4,2),
    status public.shift_status NOT NULL DEFAULT 'scheduled',
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT valid_hours CHECK (actual_hours_worked IS NULL OR actual_hours_worked >= 0)
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_individual_shifts_date ON public.individual_shifts(date);
CREATE INDEX IF NOT EXISTS idx_individual_shifts_employee ON public.individual_shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_individual_shifts_status ON public.individual_shifts(status);
CREATE INDEX IF NOT EXISTS idx_shift_options_category ON public.shift_options(name);
CREATE UNIQUE INDEX IF NOT EXISTS teams_name_key ON public.teams(name);

alter table "public"."employees" alter column "shift_pattern" drop default;

alter type "public"."shift_pattern" rename to "shift_pattern__old_version_to_be_dropped";

create type "public"."shift_pattern" as enum ('4x10', '3x12_plus_4');

alter table "public"."employees" alter column shift_pattern type "public"."shift_pattern" using shift_pattern::text::"public"."shift_pattern";

alter table "public"."employees" alter column "shift_pattern" set default '4x10'::shift_pattern;

drop type "public"."shift_pattern__old_version_to_be_dropped";

-- Remove column drops since they don't exist
-- alter table "public"."employees" drop column "preferred_shift_category";
-- alter table "public"."employees" drop column "team_id";

alter table "public"."employees" alter column "shift_pattern" set default '4x10'::shift_pattern;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_first_name text;
  v_last_name text;
  v_role public.employee_role;
  v_shift_pattern public.shift_pattern;
BEGIN
  -- Extract user metadata with proper error handling
  BEGIN
    v_first_name := COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      split_part(NEW.email, '@', 1)
    );
    
    v_last_name := COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      ''
    );
    
    v_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.employee_role,
      'dispatcher'
    );
    
    v_shift_pattern := COALESCE(
      (NEW.raw_user_meta_data->>'shift_pattern')::public.shift_pattern,
      '4x10'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error and use defaults
    RAISE WARNING 'Error processing user metadata: %', SQLERRM;
    v_first_name := split_part(NEW.email, '@', 1);
    v_last_name := '';
    v_role := 'dispatcher';
    v_shift_pattern := '4x10';
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

  -- Set profile_incomplete flag only if necessary fields are missing
  IF v_first_name = split_part(NEW.email, '@', 1) OR v_last_name = '' THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{profile_incomplete}',
      'true'::jsonb
    )
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log any errors but don't prevent user creation
  RAISE WARNING 'Error in handle_auth_user_created: %', SQLERRM;
  RETURN NEW;
END;
$function$
;


