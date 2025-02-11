-- Disable the trigger temporarily
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Insert a test user directly
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000'::uuid,
    'test.manual@shifterino.com',
    crypt('TestPassword123!', gen_salt('bf')),
    NOW(),
    jsonb_build_object(
        'role', 'DISPATCHER',
        'first_name', 'Test',
        'last_name', 'Manual'
    )
);

-- Re-enable the trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- Test the trigger with another user
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000'::uuid,
    'test.trigger@shifterino.com',
    crypt('TestPassword123!', gen_salt('bf')),
    NOW(),
    jsonb_build_object(
        'role', 'DISPATCHER',
        'first_name', 'Test',
        'last_name', 'Trigger'
    )
); 