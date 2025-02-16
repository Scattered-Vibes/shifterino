-- Drop existing test helper functions
DROP FUNCTION IF EXISTS tests.gen_salt(text);
DROP FUNCTION IF EXISTS tests.crypt(text, text);

-- Create proper bcrypt-based test helper functions
CREATE OR REPLACE FUNCTION tests.gen_salt(text)
RETURNS text AS $$
BEGIN
    -- Use pgcrypto's gen_salt with bcrypt and cost factor 10
    RETURN gen_salt('bf', 10);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create proper password hashing function
CREATE OR REPLACE FUNCTION tests.crypt(password text, salt text)
RETURNS text AS $$
BEGIN
    -- Use pgcrypto's crypt function with the provided salt
    RETURN crypt(password, salt);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION tests.gen_salt(text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION tests.crypt(text, text) TO authenticated, anon, service_role; 