-- Enable JWT authentication and verification
create extension if not exists "pgjwt" with schema extensions;

-- Configure auth settings
alter table auth.users enable row level security;

-- Set up RLS policies for users
create policy "Users can view own data"
  on auth.users
  for select
  using (auth.uid() = id);

-- Configure JWT claims
create or replace function auth.jwt() returns jsonb as $$
begin
  return jsonb_build_object(
    'role', current_user,
    'aud', 'authenticated',
    'exp', extract(epoch from (now() + interval '7 days'))::integer,
    'sub', auth.uid()::text,
    'email', (select email from auth.users where id = auth.uid()),
    'app_metadata', (
      select jsonb_build_object(
        'provider', provider,
        'providers', array_agg(provider)
      )
      from auth.identities
      where user_id = auth.uid()
      group by provider
    ),
    'user_metadata', (
      select raw_user_meta_data
      from auth.users
      where id = auth.uid()
    )
  );
end;
$$ language plpgsql security definer;

-- Set up RLS policies for auth tables
alter table auth.refresh_tokens enable row level security;
alter table auth.sessions enable row level security;
alter table auth.mfa_factors enable row level security;
alter table auth.mfa_amr_claims enable row level security;
alter table auth.mfa_challenges enable row level security;

-- Create RLS policies for auth tables
create policy "Users can manage own refresh tokens"
  on auth.refresh_tokens
  for all
  using (auth.uid() = user_id);

create policy "Users can manage own sessions"
  on auth.sessions
  for all
  using (auth.uid() = user_id);

create policy "Users can view own mfa factors"
  on auth.mfa_factors
  for select
  using (auth.uid() = user_id);

create policy "Users can manage own mfa factors"
  on auth.mfa_factors
  for all
  using (auth.uid() = user_id);

create policy "Users can view own amr claims"
  on auth.mfa_amr_claims
  for select
  using (auth.uid() = user_id);

create policy "Users can manage own amr claims"
  on auth.mfa_amr_claims
  for all
  using (auth.uid() = user_id);

create policy "Users can view own challenges"
  on auth.mfa_challenges
  for select
  using (auth.uid() = user_id);

create policy "Users can manage own challenges"
  on auth.mfa_challenges
  for all
  using (auth.uid() = user_id);

-- Set up audit logging
create table if not exists auth.audit_log_entries (
  instance_id uuid,
  id uuid not null,
  payload json,
  created_at timestamptz,
  ip_address varchar(64)
);

create index if not exists audit_logs_instance_id_idx on auth.audit_log_entries (instance_id);
create index if not exists audit_logs_id_idx on auth.audit_log_entries (id);
create index if not exists audit_logs_created_at_idx on auth.audit_log_entries (created_at);

-- Configure rate limiting
create table if not exists auth.rate_limits (
  id bigserial primary key,
  entity_id uuid not null,
  entity_type text not null,
  action text not null,
  attempts int not null default 0,
  last_attempted_at timestamptz not null default now(),
  blocked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists rate_limits_entity_action_idx 
  on auth.rate_limits (entity_id, entity_type, action);

create index if not exists rate_limits_blocked_until_idx 
  on auth.rate_limits (blocked_until);

-- Function to check rate limits
create or replace function auth.check_rate_limit(
  p_entity_id uuid,
  p_entity_type text,
  p_action text,
  p_max_attempts int,
  p_window interval,
  p_block_duration interval
) returns boolean as $$
declare
  v_rate_limit auth.rate_limits%rowtype;
begin
  -- Get or create rate limit record
  insert into auth.rate_limits (entity_id, entity_type, action)
  values (p_entity_id, p_entity_type, p_action)
  on conflict (entity_id, entity_type, action) do update
  set attempts = case
    when auth.rate_limits.last_attempted_at < now() - p_window then 1
    else auth.rate_limits.attempts + 1
    end,
    last_attempted_at = now(),
    blocked_until = case
    when auth.rate_limits.last_attempted_at < now() - p_window then null
    when auth.rate_limits.attempts + 1 >= p_max_attempts then now() + p_block_duration
    else auth.rate_limits.blocked_until
    end
  returning * into v_rate_limit;

  -- Check if blocked
  if v_rate_limit.blocked_until is not null and v_rate_limit.blocked_until > now() then
    return false;
  end if;

  -- Check attempts within window
  if v_rate_limit.attempts >= p_max_attempts and 
     v_rate_limit.last_attempted_at > now() - p_window then
    return false;
  end if;

  return true;
end;
$$ language plpgsql security definer;