drop trigger if exists "set_individual_shifts_created_by" on "public"."individual_shifts";

drop trigger if exists "set_individual_shifts_updated_by" on "public"."individual_shifts";

drop trigger if exists "update_individual_shifts_updated_at" on "public"."individual_shifts";

drop policy "employees_select_own" on "public"."employees";

drop policy "employees_update_own" on "public"."employees";

drop policy "shift_options_modify_managers" on "public"."shift_options";

drop policy "shift_options_read_all" on "public"."shift_options";

drop policy "teams_modify_managers" on "public"."teams";

drop policy "teams_read_all" on "public"."teams";

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

alter table "public"."employees" alter column "shift_pattern" drop default;

alter type "public"."shift_pattern" rename to "shift_pattern__old_version_to_be_dropped";

create type "public"."shift_pattern" as enum ('4x10', '3x12_plus_4');

alter table "public"."employees" alter column shift_pattern type "public"."shift_pattern" using shift_pattern::text::"public"."shift_pattern";

alter table "public"."employees" alter column "shift_pattern" set default '4_10'::shift_pattern;

drop type "public"."shift_pattern__old_version_to_be_dropped";

alter table "public"."employees" drop column "preferred_shift_category";

alter table "public"."employees" drop column "team_id";

alter table "public"."employees" alter column "shift_pattern" set default '4x10'::shift_pattern;

drop type "public"."holiday_type";

drop type "public"."on_call_status";

drop type "public"."schedule_status";

drop type "public"."shift_category";

drop type "public"."shift_status";

drop type "public"."swap_request_status";

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


