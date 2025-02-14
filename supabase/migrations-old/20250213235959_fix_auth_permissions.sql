-- Grant schema usage
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Grant permissions on all existing tables
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon;

-- Grant permissions on all existing sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, authenticated, service_role;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA auth TO anon;

-- Grant permissions on all existing functions
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon;

-- Set default permissions for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA auth
GRANT ALL ON TABLES TO postgres, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA auth
GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA auth
GRANT ALL ON SEQUENCES TO postgres, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA auth
GRANT SELECT ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA auth
GRANT ALL ON FUNCTIONS TO postgres, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA auth
GRANT EXECUTE ON FUNCTIONS TO anon; 