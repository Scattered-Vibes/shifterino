-- Safely drop policies if they exist
DO $$ BEGIN
    -- Drop old policies if they exist
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

-- Ensure all necessary policies exist with correct names
DO $$ BEGIN
    -- Recreate policies with new names if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'employees_self_access' AND tablename = 'employees') THEN
        CREATE POLICY "employees_self_access" ON public.employees
            FOR SELECT USING (auth_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'supervisors_managers_view_all' AND tablename = 'employees') THEN
        CREATE POLICY "supervisors_managers_view_all" ON public.employees
            FOR SELECT USING (public.check_user_role(ARRAY['supervisor', 'manager']));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'all_view_shifts' AND tablename = 'shifts') THEN
        CREATE POLICY "all_view_shifts" ON public.shifts
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'managers_manage_shifts' AND tablename = 'shifts') THEN
        CREATE POLICY "managers_manage_shifts" ON public.shifts
            FOR ALL USING (public.check_user_role(ARRAY['manager']));
    END IF;
END $$;
