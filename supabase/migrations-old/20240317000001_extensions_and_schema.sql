-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist; -- Required for exclusion constraints
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA extensions;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;

-- Add unique constraint on employees.auth_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'employees_auth_id_key'
    ) THEN
        ALTER TABLE IF EXISTS public.employees 
        ADD CONSTRAINT employees_auth_id_key 
        UNIQUE (auth_id);
    END IF;
END $$; 