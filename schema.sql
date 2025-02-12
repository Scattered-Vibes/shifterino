

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "test_helpers";


ALTER SCHEMA "test_helpers" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."employee_role" AS ENUM (
    'dispatcher',
    'supervisor',
    'manager'
);


ALTER TYPE "public"."employee_role" OWNER TO "postgres";


CREATE TYPE "public"."log_severity" AS ENUM (
    'info',
    'warning',
    'error'
);


ALTER TYPE "public"."log_severity" OWNER TO "postgres";


CREATE TYPE "public"."shift_category" AS ENUM (
    'early',
    'day',
    'swing',
    'graveyard'
);


ALTER TYPE "public"."shift_category" OWNER TO "postgres";


CREATE TYPE "public"."shift_pattern" AS ENUM (
    'pattern_a',
    'pattern_b',
    'custom'
);


ALTER TYPE "public"."shift_pattern" OWNER TO "postgres";


CREATE TYPE "public"."shift_status" AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'missed',
    'cancelled'
);


ALTER TYPE "public"."shift_status" OWNER TO "postgres";


CREATE TYPE "public"."time_off_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE "public"."time_off_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'extensions'
    AS $$
DECLARE
    v_role public.employee_role;
    v_email TEXT;
    v_user_id UUID;
    v_creator_id UUID;
    v_first_name TEXT;
    v_last_name TEXT;
    v_raw_role TEXT;
    v_error_details JSONB;
BEGIN
    INSERT INTO public.auth_logs (operation, user_id, details)
    VALUES ('signup_start', NEW.id, jsonb_build_object('email', NEW.email));

    BEGIN
        IF NEW.raw_user_meta_data IS NULL THEN
            NEW.raw_user_meta_data := '{}'::jsonb;
        END IF;

        v_user_id := NEW.id;
        v_email := NEW.email;
        v_creator_id := (NEW.raw_user_meta_data->>'created_by')::UUID;
        v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
        v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
        v_raw_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', 'dispatcher')));

        IF v_raw_role NOT IN ('dispatcher', 'supervisor', 'manager') THEN
            v_role := 'dispatcher'::public.employee_role;
        ELSE
            v_role := v_raw_role::public.employee_role;
        END IF;

        NEW.role := v_role::TEXT;

        INSERT INTO public.profiles (id, email, role, is_email_verified)
        VALUES (v_user_id, v_email, v_role::TEXT, (NEW.email_confirmed_at IS NOT NULL))
        ON CONFLICT (id) DO UPDATE 
        SET email = EXCLUDED.email,
            role = EXCLUDED.role,
            is_email_verified = EXCLUDED.is_email_verified,
            updated_at = CURRENT_TIMESTAMP;

        INSERT INTO public.employees (
            auth_id,
            first_name,
            last_name,
            email,
            role,
            shift_pattern,
            created_by
        )
        VALUES (
            v_user_id,
            v_first_name,
            v_last_name,
            v_email,
            v_role,
            CASE 
                WHEN v_role = 'supervisor' THEN 'pattern_a'::public.shift_pattern 
                ELSE 'pattern_b'::public.shift_pattern 
            END,
            v_creator_id
        )
        ON CONFLICT (auth_id) DO UPDATE 
        SET first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email,
            role = EXCLUDED.role,
            updated_at = CURRENT_TIMESTAMP;

        INSERT INTO public.auth_logs (operation, user_id, details)
        VALUES ('signup_success', NEW.id, jsonb_build_object(
            'email', v_email,
            'role', v_role
        ));
        RETURN NEW;

    EXCEPTION WHEN OTHERS THEN
        v_error_details := jsonb_build_object(
            'email', v_email,
            'error_code', SQLSTATE,
            'error_message', SQLERRM,
            'user_id', v_user_id
        );
        INSERT INTO public.auth_logs (operation, user_id, details, error_message)
        VALUES ('signup_error', NEW.id, v_error_details, SQLERRM);
        RAISE EXCEPTION 'Error in handle_new_user: %', SQLERRM;
    END;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_session"("session_token" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'auth', 'public'
    AS $$
DECLARE
  session_id uuid;
BEGIN
  -- Extract session_id from the session token
  -- In practice, this would validate the JWT and extract the session ID
  -- For now, we'll just check if the session exists in auth.sessions
  BEGIN
    session_id := session_token::uuid;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error if in development
    IF current_setting('app.settings.environment', TRUE) = 'development' THEN
      RAISE NOTICE 'Invalid session token format: %', session_token;
    END IF;
    RETURN false;
  END;

  -- Verify session exists and is valid
  RETURN EXISTS (
    SELECT 1
    FROM auth.sessions s
    WHERE s.id = session_id
      AND (s.not_after IS NULL OR s.not_after > now())
  );
END;
$$;


ALTER FUNCTION "public"."validate_session"("session_token" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_session"("session_token" "text") IS 'Validates a session token and returns true if the session is valid';



CREATE OR REPLACE FUNCTION "test_helpers"."clean_test_data"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    DELETE FROM public.shift_swap_requests WHERE shift_id IN (
        SELECT id FROM public.individual_shifts WHERE schedule_period_id IN (
            SELECT id FROM public.schedule_periods WHERE created_at >= CURRENT_DATE
        )
    );
    DELETE FROM public.scheduling_logs WHERE schedule_period_id IN (
        SELECT id FROM public.schedule_periods WHERE created_at >= CURRENT_DATE
    );
    DELETE FROM public.individual_shifts WHERE schedule_period_id IN (
        SELECT id FROM public.schedule_periods WHERE created_at >= CURRENT_DATE
    );
    DELETE FROM public.time_off_requests WHERE employee_id IN (
        SELECT id FROM public.employees WHERE email LIKE '%@test.com'
    );
    DELETE FROM public.shift_options WHERE name LIKE 'Test%';
    DELETE FROM public.schedule_periods WHERE created_at >= CURRENT_DATE;
    DELETE FROM public.employees WHERE email LIKE '%@test.com';
    DELETE FROM public.profiles WHERE email LIKE '%@test.com';
    DELETE FROM auth.users WHERE email LIKE '%@test.com';
END;
$$;


ALTER FUNCTION "test_helpers"."clean_test_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "test_helpers"."create_test_user"("p_email" "text", "p_role" "text", "p_suffix" "text" DEFAULT ''::"text") RETURNS TABLE("auth_id" "uuid", "employee_id" "uuid")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_auth_id uuid;
    v_employee_id uuid;
    v_email text;
BEGIN
    IF p_suffix = '' THEN
        v_email := p_email;
    ELSE
        v_email := replace(p_email, '@', '_' || p_suffix || '@');
    END IF;
    ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
    INSERT INTO auth.users (
        email,
        role,
        encrypted_password,
        raw_user_meta_data,
        created_at,
        updated_at
    )
    VALUES (
        v_email,
        p_role,
        'test-password',
        jsonb_build_object('role', p_role),
        NOW(),
        NOW()
    )
    RETURNING id INTO v_auth_id;
    
    INSERT INTO public.profiles (id, email, role)
    VALUES (v_auth_id, v_email, p_role);
    
    INSERT INTO public.employees (
        auth_id,
        first_name,
        last_name,
        email,
        role,
        shift_pattern
    )
    VALUES (
        v_auth_id,
        'Test',
        'User',
        v_email,
        p_role::employee_role,
        'pattern_a'
    )
    RETURNING id INTO v_employee_id;
    
    ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
    
    RETURN QUERY SELECT v_auth_id, v_employee_id;
END;
$$;


ALTER FUNCTION "test_helpers"."create_test_user"("p_email" "text", "p_role" "text", "p_suffix" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "test_helpers"."set_auth_user"("p_user_id" "uuid", "p_role" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM set_config('request.jwt.claim.sub', COALESCE(p_user_id::text, ''), true);
    PERFORM set_config('request.jwt.claim.role', p_role, true);
END;
$$;


ALTER FUNCTION "test_helpers"."set_auth_user"("p_user_id" "uuid", "p_role" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."auth_logs" (
    "id" integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "operation" "text",
    "user_id" "uuid",
    "details" "jsonb",
    "error_message" "text"
);


ALTER TABLE "public"."auth_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."auth_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."auth_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."auth_logs_id_seq" OWNED BY "public"."auth_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "public"."employee_role" NOT NULL,
    "shift_pattern" "public"."shift_pattern" NOT NULL,
    "preferred_shift_category" "public"."shift_category",
    "weekly_hours_cap" integer DEFAULT 40 NOT NULL,
    "max_overtime_hours" integer DEFAULT 0,
    "last_shift_date" "date",
    "total_hours_current_week" integer DEFAULT 0,
    "consecutive_shifts_count" integer DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "weekly_hours" integer DEFAULT 40 NOT NULL,
    CONSTRAINT "weekly_hours_check" CHECK ((("weekly_hours" >= 0) AND ("weekly_hours" <= 168)))
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."individual_shifts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "shift_option_id" "uuid" NOT NULL,
    "schedule_period_id" "uuid",
    "date" "date" NOT NULL,
    "status" "public"."shift_status" DEFAULT 'scheduled'::"public"."shift_status" NOT NULL,
    "is_overtime" boolean DEFAULT false NOT NULL,
    "actual_start_time" timestamp with time zone,
    "actual_end_time" timestamp with time zone,
    "break_start_time" timestamp with time zone,
    "break_end_time" timestamp with time zone,
    "break_duration_minutes" integer,
    "actual_hours_worked" numeric(5,2),
    "notes" "text",
    "schedule_conflict_notes" "text",
    "is_regular_schedule" boolean DEFAULT true NOT NULL,
    "supervisor_approved_by" "uuid",
    "supervisor_approved_at" timestamp with time zone,
    "shift_score" integer,
    "fatigue_level" integer,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "supervisor_approval_complete" CHECK (((("supervisor_approved_by" IS NULL) AND ("supervisor_approved_at" IS NULL)) OR (("supervisor_approved_by" IS NOT NULL) AND ("supervisor_approved_at" IS NOT NULL)))),
    CONSTRAINT "valid_actual_times" CHECK (((("actual_start_time" IS NULL) AND ("actual_end_time" IS NULL)) OR (("actual_start_time" IS NOT NULL) AND ("actual_end_time" IS NOT NULL) AND ("actual_start_time" < "actual_end_time")))),
    CONSTRAINT "valid_break_duration" CHECK ((("break_duration_minutes" >= 0) AND ("break_duration_minutes" <= 60))),
    CONSTRAINT "valid_break_times" CHECK (((("break_start_time" IS NULL) AND ("break_end_time" IS NULL)) OR (("break_start_time" IS NOT NULL) AND ("break_end_time" IS NOT NULL) AND ("break_start_time" < "break_end_time")))),
    CONSTRAINT "valid_shift_hours" CHECK ((("actual_hours_worked" >= (0)::numeric) AND ("actual_hours_worked" <= (24)::numeric)))
);


ALTER TABLE "public"."individual_shifts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedule_periods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_date_range" CHECK (("end_date" > "start_date"))
);


ALTER TABLE "public"."schedule_periods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shift_assignment_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "shift_id" "uuid" NOT NULL,
    "schedule_period_id" "uuid" NOT NULL,
    "preference_score" integer NOT NULL,
    "fatigue_score" integer NOT NULL,
    "fairness_score" integer NOT NULL,
    "total_score" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_scores" CHECK ((("preference_score" >= 0) AND ("fatigue_score" >= 0) AND ("fairness_score" >= 0)))
);


ALTER TABLE "public"."shift_assignment_scores" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."mv_schedule_statistics" AS
 SELECT "e"."id" AS "employee_id",
    "e"."first_name",
    "e"."last_name",
    "e"."role",
    "count"("i"."id") AS "total_shifts",
    "avg"("i"."actual_hours_worked") AS "avg_hours_per_shift",
    "sum"("i"."actual_hours_worked") AS "total_hours",
    "count"(DISTINCT "sp"."id") AS "periods_worked",
    "avg"("sas"."total_score") AS "avg_score"
   FROM ((("public"."employees" "e"
     LEFT JOIN "public"."individual_shifts" "i" ON (("i"."employee_id" = "e"."id")))
     LEFT JOIN "public"."schedule_periods" "sp" ON (("sp"."id" = "i"."schedule_period_id")))
     LEFT JOIN "public"."shift_assignment_scores" "sas" ON (("sas"."employee_id" = "e"."id")))
  GROUP BY "e"."id", "e"."first_name", "e"."last_name", "e"."role"
  WITH NO DATA;


ALTER TABLE "public"."mv_schedule_statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "is_email_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_role" CHECK (("role" = ANY (ARRAY['dispatcher'::"text", 'supervisor'::"text", 'manager'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "shift_type" "text" NOT NULL,
    "shift_pattern" "public"."shift_pattern" NOT NULL,
    "is_supervisor" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "updated_by" "uuid" NOT NULL,
    CONSTRAINT "schedules_shift_type_check" CHECK (("shift_type" = ANY (ARRAY['day_early'::"text", 'day'::"text", 'swing'::"text", 'graveyard'::"text"]))),
    CONSTRAINT "schedules_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scheduling_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "schedule_period_id" "uuid",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "log_message" "text" NOT NULL,
    "severity" "public"."log_severity" NOT NULL,
    "related_employee_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."scheduling_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shift_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "duration_hours" integer NOT NULL,
    "category" "public"."shift_category" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "valid_duration" CHECK (("duration_hours" = ANY (ARRAY[4, 10, 12])))
);


ALTER TABLE "public"."shift_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shift_pattern_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pattern" "public"."shift_pattern" NOT NULL,
    "consecutive_shifts" integer NOT NULL,
    "shift_durations" integer[] NOT NULL,
    "min_rest_hours" integer DEFAULT 10 NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "valid_consecutive_shifts" CHECK (("consecutive_shifts" > 0)),
    CONSTRAINT "valid_min_rest" CHECK (("min_rest_hours" >= 8))
);


ALTER TABLE "public"."shift_pattern_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shift_swap_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "requested_employee_id" "uuid" NOT NULL,
    "shift_id" "uuid" NOT NULL,
    "proposed_shift_id" "uuid",
    "status" "public"."time_off_status" DEFAULT 'pending'::"public"."time_off_status" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "different_employees" CHECK (("requester_id" <> "requested_employee_id"))
);


ALTER TABLE "public"."shift_swap_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staffing_requirements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "time_block_start" time without time zone NOT NULL,
    "time_block_end" time without time zone NOT NULL,
    "min_total_staff" integer NOT NULL,
    "min_supervisors" integer DEFAULT 1 NOT NULL,
    "schedule_period_id" "uuid",
    "is_holiday" boolean DEFAULT false,
    "override_reason" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."staffing_requirements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "setting_key" "text" NOT NULL,
    "setting_value" "text" NOT NULL,
    "description" "text",
    "is_encrypted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."time_off_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "status" "public"."time_off_status" DEFAULT 'pending'::"public"."time_off_status" NOT NULL,
    "notes" "text",
    "reason" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."time_off_requests" OWNER TO "postgres";


ALTER TABLE ONLY "public"."auth_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."auth_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."auth_logs"
    ADD CONSTRAINT "auth_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_auth_id_key" UNIQUE ("auth_id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."individual_shifts"
    ADD CONSTRAINT "individual_shifts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_periods"
    ADD CONSTRAINT "schedule_periods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scheduling_logs"
    ADD CONSTRAINT "scheduling_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shift_assignment_scores"
    ADD CONSTRAINT "shift_assignment_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shift_options"
    ADD CONSTRAINT "shift_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shift_pattern_rules"
    ADD CONSTRAINT "shift_pattern_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shift_swap_requests"
    ADD CONSTRAINT "shift_swap_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staffing_requirements"
    ADD CONSTRAINT "staffing_requirements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_setting_key_key" UNIQUE ("setting_key");



ALTER TABLE ONLY "public"."time_off_requests"
    ADD CONSTRAINT "time_off_requests_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "idx_mv_schedule_statistics" ON "public"."mv_schedule_statistics" USING "btree" ("employee_id");



CREATE INDEX "idx_schedules_date_range" ON "public"."schedules" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_schedules_employee_id" ON "public"."schedules" USING "btree" ("employee_id");



CREATE INDEX "idx_schedules_shift_type" ON "public"."schedules" USING "btree" ("shift_type");



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."schedules" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_employees_updated_at" BEFORE UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_individual_shifts_updated_at" BEFORE UPDATE ON "public"."individual_shifts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_schedule_periods_updated_at" BEFORE UPDATE ON "public"."schedule_periods" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_shift_options_updated_at" BEFORE UPDATE ON "public"."shift_options" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_shift_pattern_rules_updated_at" BEFORE UPDATE ON "public"."shift_pattern_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_shift_swap_requests_updated_at" BEFORE UPDATE ON "public"."shift_swap_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_staffing_requirements_updated_at" BEFORE UPDATE ON "public"."staffing_requirements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_system_settings_updated_at" BEFORE UPDATE ON "public"."system_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_time_off_requests_updated_at" BEFORE UPDATE ON "public"."time_off_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."individual_shifts"
    ADD CONSTRAINT "individual_shifts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."individual_shifts"
    ADD CONSTRAINT "individual_shifts_schedule_period_id_fkey" FOREIGN KEY ("schedule_period_id") REFERENCES "public"."schedule_periods"("id");



ALTER TABLE ONLY "public"."individual_shifts"
    ADD CONSTRAINT "individual_shifts_shift_option_id_fkey" FOREIGN KEY ("shift_option_id") REFERENCES "public"."shift_options"("id");



ALTER TABLE ONLY "public"."individual_shifts"
    ADD CONSTRAINT "individual_shifts_supervisor_approved_by_fkey" FOREIGN KEY ("supervisor_approved_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("auth_id");



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."scheduling_logs"
    ADD CONSTRAINT "scheduling_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."scheduling_logs"
    ADD CONSTRAINT "scheduling_logs_related_employee_id_fkey" FOREIGN KEY ("related_employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."scheduling_logs"
    ADD CONSTRAINT "scheduling_logs_schedule_period_id_fkey" FOREIGN KEY ("schedule_period_id") REFERENCES "public"."schedule_periods"("id");



ALTER TABLE ONLY "public"."shift_assignment_scores"
    ADD CONSTRAINT "shift_assignment_scores_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."shift_assignment_scores"
    ADD CONSTRAINT "shift_assignment_scores_schedule_period_id_fkey" FOREIGN KEY ("schedule_period_id") REFERENCES "public"."schedule_periods"("id");



ALTER TABLE ONLY "public"."shift_assignment_scores"
    ADD CONSTRAINT "shift_assignment_scores_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "public"."individual_shifts"("id");



ALTER TABLE ONLY "public"."shift_swap_requests"
    ADD CONSTRAINT "shift_swap_requests_proposed_shift_id_fkey" FOREIGN KEY ("proposed_shift_id") REFERENCES "public"."individual_shifts"("id");



ALTER TABLE ONLY "public"."shift_swap_requests"
    ADD CONSTRAINT "shift_swap_requests_requested_employee_id_fkey" FOREIGN KEY ("requested_employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."shift_swap_requests"
    ADD CONSTRAINT "shift_swap_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."shift_swap_requests"
    ADD CONSTRAINT "shift_swap_requests_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "public"."individual_shifts"("id");



ALTER TABLE ONLY "public"."time_off_requests"
    ADD CONSTRAINT "time_off_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



CREATE POLICY "Supervisors can manage schedules" ON "public"."schedules" USING ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."auth_id" = "auth"."uid"()) AND ("employees"."role" = 'supervisor'::"public"."employee_role")))));



CREATE POLICY "Supervisors can view all schedules" ON "public"."schedules" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."auth_id" = "auth"."uid"()) AND ("employees"."role" = 'supervisor'::"public"."employee_role")))));



CREATE POLICY "Users can view their own schedules" ON "public"."schedules" FOR SELECT USING (("auth"."uid"() = "employee_id"));



ALTER TABLE "public"."schedules" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_session"("session_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_session"("session_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_session"("session_token" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."auth_logs" TO "anon";
GRANT ALL ON TABLE "public"."auth_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."auth_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."auth_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."auth_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."individual_shifts" TO "anon";
GRANT ALL ON TABLE "public"."individual_shifts" TO "authenticated";
GRANT ALL ON TABLE "public"."individual_shifts" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_periods" TO "anon";
GRANT ALL ON TABLE "public"."schedule_periods" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_periods" TO "service_role";



GRANT ALL ON TABLE "public"."shift_assignment_scores" TO "anon";
GRANT ALL ON TABLE "public"."shift_assignment_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."shift_assignment_scores" TO "service_role";



GRANT ALL ON TABLE "public"."mv_schedule_statistics" TO "anon";
GRANT ALL ON TABLE "public"."mv_schedule_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."mv_schedule_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."schedules" TO "anon";
GRANT ALL ON TABLE "public"."schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."schedules" TO "service_role";



GRANT ALL ON TABLE "public"."scheduling_logs" TO "anon";
GRANT ALL ON TABLE "public"."scheduling_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."scheduling_logs" TO "service_role";



GRANT ALL ON TABLE "public"."shift_options" TO "anon";
GRANT ALL ON TABLE "public"."shift_options" TO "authenticated";
GRANT ALL ON TABLE "public"."shift_options" TO "service_role";



GRANT ALL ON TABLE "public"."shift_pattern_rules" TO "anon";
GRANT ALL ON TABLE "public"."shift_pattern_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."shift_pattern_rules" TO "service_role";



GRANT ALL ON TABLE "public"."shift_swap_requests" TO "anon";
GRANT ALL ON TABLE "public"."shift_swap_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."shift_swap_requests" TO "service_role";



GRANT ALL ON TABLE "public"."staffing_requirements" TO "anon";
GRANT ALL ON TABLE "public"."staffing_requirements" TO "authenticated";
GRANT ALL ON TABLE "public"."staffing_requirements" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."time_off_requests" TO "anon";
GRANT ALL ON TABLE "public"."time_off_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."time_off_requests" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
