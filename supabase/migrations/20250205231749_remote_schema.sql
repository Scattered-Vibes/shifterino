CREATE INDEX refresh_tokens_token_idx ON auth.refresh_tokens USING btree (token); 

CREATE INDEX refresh_tokens_user_id_idx ON auth.refresh_tokens USING btree (user_id);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION auth.create_dispatcher_user(user_id uuid, email text, password text, role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'auth', 'public', 'extensions'
AS $function$
DECLARE
    _encrypted_password TEXT;
BEGIN
    -- Use auth schema's password hashing
    _encrypted_password := auth.hash_password(password);
    
    -- Create user in auth schema
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        role,
        confirmation_token,
        aud
    )
    VALUES (
        user_id,
        '00000000-0000-0000-0000-000000000000',
        email,
        _encrypted_password,
        NOW(),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
        jsonb_build_object('role', role),
        NOW(),
        NOW(),
        role,
        encode(gen_random_bytes(32), 'base64'),
        'authenticated'
    );

    -- Create identity
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        created_at,
        updated_at,
        last_sign_in_at
    )
    VALUES (
        user_id,
        user_id,
        jsonb_build_object(
            'sub', user_id::text,
            'email', email,
            'email_verified', true
        ),
        'email',
        email,
        NOW(),
        NOW(),
        NOW()
    );

    -- Create refresh token
    INSERT INTO auth.refresh_tokens (
        instance_id,
        user_id,
        token,
        created_at,
        updated_at,
        parent,
        revoked
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        user_id,
        encode(gen_random_bytes(48), 'base64'),
        NOW(),
        NOW(),
        NULL,
        false
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION auth.hash_password(password text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN extensions.crypt(password, extensions.gen_salt('bf', 10));
END;
$function$
;

grant delete on table "auth"."secrets" to "authenticator";

grant insert on table "auth"."secrets" to "authenticator";

grant references on table "auth"."secrets" to "authenticator";

grant trigger on table "auth"."secrets" to "authenticator";

grant truncate on table "auth"."secrets" to "authenticator";

grant update on table "auth"."secrets" to "authenticator";

grant delete on table "auth"."secrets" to "service_role";

grant insert on table "auth"."secrets" to "service_role";

grant references on table "auth"."secrets" to "service_role";

grant select on table "auth"."secrets" to "service_role";

grant trigger on table "auth"."secrets" to "service_role";

grant truncate on table "auth"."secrets" to "service_role";

grant update on table "auth"."secrets" to "service_role";


