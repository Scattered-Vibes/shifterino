

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



CREATE EXTENSION IF NOT EXISTS "btree_gist" WITH SCHEMA "extensions";






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


CREATE TYPE "public"."shift_pattern" AS ENUM (
    '4x10',
    '3x12_plus_4'
);


ALTER TYPE "public"."shift_pattern" OWNER TO "postgres";


CREATE TYPE "public"."time_off_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE "public"."time_off_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_shift_overlap"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."check_shift_overlap"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_role"("required_roles" "text"[]) RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."check_user_role"("required_roles" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_auth_user_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_auth_user_created"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_created_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    NEW.created_by = auth.uid();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_created_by"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_by"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."assigned_shifts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "shift_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."assigned_shifts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "auth_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "role" "public"."employee_role" DEFAULT 'dispatcher'::"public"."employee_role" NOT NULL,
    "shift_pattern" "public"."shift_pattern" DEFAULT '4x10'::"public"."shift_pattern" NOT NULL,
    "weekly_hours_cap" integer DEFAULT 40 NOT NULL,
    "max_overtime_hours" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shifts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "duration_hours" numeric(4,2) NOT NULL,
    "is_overnight" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "valid_duration" CHECK ((("duration_hours" > (0)::numeric) AND ("duration_hours" <= (12)::numeric)))
);


ALTER TABLE "public"."shifts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staffing_requirements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "min_total_staff" integer NOT NULL,
    "min_supervisors" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "valid_staff_count" CHECK (("min_total_staff" >= "min_supervisors")),
    CONSTRAINT "valid_time_range" CHECK (("start_time" <> "end_time"))
);


ALTER TABLE "public"."staffing_requirements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."time_off_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "status" "public"."time_off_status" DEFAULT 'pending'::"public"."time_off_status" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "valid_date_range" CHECK (("end_date" >= "start_date"))
);


ALTER TABLE "public"."time_off_requests" OWNER TO "postgres";


ALTER TABLE ONLY "public"."assigned_shifts"
    ADD CONSTRAINT "assigned_shifts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_auth_id_key" UNIQUE ("auth_id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staffing_requirements"
    ADD CONSTRAINT "staffing_requirements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."time_off_requests"
    ADD CONSTRAINT "time_off_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assigned_shifts"
    ADD CONSTRAINT "unique_employee_shift_date" UNIQUE ("employee_id", "date");



CREATE INDEX "idx_assigned_shifts_date" ON "public"."assigned_shifts" USING "btree" ("date");



CREATE INDEX "idx_assigned_shifts_employee" ON "public"."assigned_shifts" USING "btree" ("employee_id");



CREATE INDEX "idx_employees_auth_id" ON "public"."employees" USING "btree" ("auth_id");



CREATE INDEX "idx_employees_role" ON "public"."employees" USING "btree" ("role");



CREATE INDEX "idx_time_off_requests_dates" ON "public"."time_off_requests" USING "gist" ("employee_id", "daterange"("start_date", "end_date", '[]'::"text"));



CREATE INDEX "idx_time_off_requests_employee" ON "public"."time_off_requests" USING "btree" ("employee_id");



CREATE OR REPLACE TRIGGER "check_shift_overlap_insert" BEFORE INSERT ON "public"."assigned_shifts" FOR EACH ROW EXECUTE FUNCTION "public"."check_shift_overlap"();



CREATE OR REPLACE TRIGGER "check_shift_overlap_update" BEFORE UPDATE ON "public"."assigned_shifts" FOR EACH ROW EXECUTE FUNCTION "public"."check_shift_overlap"();



CREATE OR REPLACE TRIGGER "set_employees_created_by" BEFORE INSERT ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by"();



CREATE OR REPLACE TRIGGER "set_employees_updated_by" BEFORE UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_by"();



CREATE OR REPLACE TRIGGER "update_employees_updated_at" BEFORE UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_shifts_updated_at" BEFORE UPDATE ON "public"."shifts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."assigned_shifts"
    ADD CONSTRAINT "assigned_shifts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."assigned_shifts"
    ADD CONSTRAINT "assigned_shifts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assigned_shifts"
    ADD CONSTRAINT "assigned_shifts_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id");



ALTER TABLE ONLY "public"."assigned_shifts"
    ADD CONSTRAINT "assigned_shifts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."staffing_requirements"
    ADD CONSTRAINT "staffing_requirements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."staffing_requirements"
    ADD CONSTRAINT "staffing_requirements_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."time_off_requests"
    ADD CONSTRAINT "time_off_requests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."time_off_requests"
    ADD CONSTRAINT "time_off_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."time_off_requests"
    ADD CONSTRAINT "time_off_requests_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



CREATE POLICY "all_view_shifts" ON "public"."shifts" FOR SELECT USING (true);



CREATE POLICY "all_view_staffing_requirements" ON "public"."staffing_requirements" FOR SELECT USING (true);



CREATE POLICY "allow_insert" ON "public"."employees" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."assigned_shifts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "create_own_time_off" ON "public"."time_off_requests" FOR INSERT WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."auth_id" = "auth"."uid"()))));



ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employees_self_access" ON "public"."employees" FOR SELECT USING (("auth_id" = "auth"."uid"()));



CREATE POLICY "managers_manage_all" ON "public"."employees" FOR UPDATE USING ("public"."check_user_role"(ARRAY['manager'::"text"])) WITH CHECK ("public"."check_user_role"(ARRAY['manager'::"text"]));



CREATE POLICY "managers_manage_shifts" ON "public"."shifts" USING ("public"."check_user_role"(ARRAY['manager'::"text"]));



CREATE POLICY "managers_manage_shifts_assignments" ON "public"."assigned_shifts" USING ("public"."check_user_role"(ARRAY['manager'::"text"]));



CREATE POLICY "managers_manage_staffing" ON "public"."staffing_requirements" USING ("public"."check_user_role"(ARRAY['manager'::"text"]));



CREATE POLICY "managers_manage_time_off" ON "public"."time_off_requests" USING ("public"."check_user_role"(ARRAY['manager'::"text"]));



ALTER TABLE "public"."shifts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."staffing_requirements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "supervisors_managers_view_all" ON "public"."employees" FOR SELECT USING ("public"."check_user_role"(ARRAY['supervisor'::"text", 'manager'::"text"]));



CREATE POLICY "supervisors_view_all_shifts" ON "public"."assigned_shifts" FOR SELECT USING ("public"."check_user_role"(ARRAY['supervisor'::"text", 'manager'::"text"]));



CREATE POLICY "supervisors_view_all_time_off" ON "public"."time_off_requests" FOR SELECT USING ("public"."check_user_role"(ARRAY['supervisor'::"text", 'manager'::"text"]));



ALTER TABLE "public"."time_off_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "view_own_shifts" ON "public"."assigned_shifts" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."auth_id" = "auth"."uid"()))));



CREATE POLICY "view_own_time_off" ON "public"."time_off_requests" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."auth_id" = "auth"."uid"()))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































































































































































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."check_shift_overlap"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_shift_overlap"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_shift_overlap"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_role"("required_roles" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_role"("required_roles" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_role"("required_roles" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_auth_user_created"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_auth_user_created"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_auth_user_created"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_created_by"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_created_by"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_created_by"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_by"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_by"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_by"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."assigned_shifts" TO "anon";
GRANT ALL ON TABLE "public"."assigned_shifts" TO "authenticated";
GRANT ALL ON TABLE "public"."assigned_shifts" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."shifts" TO "anon";
GRANT ALL ON TABLE "public"."shifts" TO "authenticated";
GRANT ALL ON TABLE "public"."shifts" TO "service_role";



GRANT ALL ON TABLE "public"."staffing_requirements" TO "anon";
GRANT ALL ON TABLE "public"."staffing_requirements" TO "authenticated";
GRANT ALL ON TABLE "public"."staffing_requirements" TO "service_role";



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
