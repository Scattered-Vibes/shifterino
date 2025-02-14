-- Fix auth trigger and permissions
DO $$ BEGIN
    -- Drop and recreate trigger with proper error handling
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_auth_user_created();

    -- Grant necessary permissions
    GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;
    GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, service_role;
    
    -- Grant select on specific auth tables to authenticated users
    GRANT SELECT ON auth.users TO authenticated;
    
    -- Ensure public schema permissions
    GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
    GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;
    
    -- Grant specific permissions to authenticated users
    GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
    
    -- Ensure RLS is enabled on necessary tables
    ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.assigned_shifts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.shift_swap_requests ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.on_call_assignments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.on_call_activations ENABLE ROW LEVEL SECURITY;
    
    -- Create policies for authenticated users
    DO $policies$ BEGIN
        -- Employees table policies
        DROP POLICY IF EXISTS "Users can view their own profile" ON public.employees;
        CREATE POLICY "Users can view their own profile" ON public.employees
            FOR SELECT USING (auth_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.employees e
                WHERE e.auth_id = auth.uid()
                AND e.role IN ('supervisor', 'manager')
            ));
            
        DROP POLICY IF EXISTS "Users can update their own profile" ON public.employees;
        CREATE POLICY "Users can update their own profile" ON public.employees
            FOR UPDATE USING (auth_id = auth.uid());
            
        -- Allow service role to manage all records
        DROP POLICY IF EXISTS "Service role full access" ON public.employees;
        CREATE POLICY "Service role full access" ON public.employees
            FOR ALL USING (current_user = 'service_role');
            
    END $policies$;
    
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error creating auth trigger or permissions: %', SQLERRM;
END $$; 