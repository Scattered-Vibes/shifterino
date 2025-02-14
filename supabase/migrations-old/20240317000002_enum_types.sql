-- Drop existing types if they exist
DO $$
BEGIN
    -- Auth-related types
    DROP TYPE IF EXISTS auth.aal_level CASCADE;
    DROP TYPE IF EXISTS auth.factor_type CASCADE;
    DROP TYPE IF EXISTS auth.factor_status CASCADE;

    -- Application types
    DROP TYPE IF EXISTS public.employee_role CASCADE;
    DROP TYPE IF EXISTS public.shift_pattern CASCADE;
    DROP TYPE IF EXISTS public.shift_category CASCADE;
    DROP TYPE IF EXISTS public.time_off_status CASCADE;
    DROP TYPE IF EXISTS public.shift_status CASCADE;
    DROP TYPE IF EXISTS public.swap_request_status CASCADE;
    DROP TYPE IF EXISTS public.on_call_status CASCADE;
    DROP TYPE IF EXISTS public.holiday_type CASCADE;
    DROP TYPE IF EXISTS public.schedule_status CASCADE;
END $$;

-- Create auth-related enum types
DO $$ BEGIN
    CREATE TYPE auth.aal_level AS ENUM ('aal1', 'aal2', 'aal3');
    CREATE TYPE auth.factor_type AS ENUM ('totp', 'webauthn');
    CREATE TYPE auth.factor_status AS ENUM ('unverified', 'verified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create application enum types
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