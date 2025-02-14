-- Grant permissions to the auth schema itself
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Ensure future objects get the same grants
ALTER DEFAULT PRIVILEGES FOR ROLE postgres, anon, authenticated, service_role IN SCHEMA auth
GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres, anon, authenticated, service_role IN SCHEMA auth
GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres, anon, authenticated, service_role IN SCHEMA auth
GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role; 