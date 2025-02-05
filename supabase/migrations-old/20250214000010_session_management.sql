-- Enable RLS
alter table auth.sessions enable row level security;

-- Create session cleanup function
create or replace function auth.cleanup_expired_sessions()
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  -- Delete expired sessions
  delete from auth.sessions s
  where not exists (
    select 1 
    from auth.users u 
    where u.id = s.user_id
    and u.last_sign_in_at > now() - interval '30 days'
  );
end;
$$;

-- Create function to validate session
create or replace function auth.validate_session(session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  valid boolean;
begin
  select exists(
    select 1
    from auth.sessions s
    join auth.users u on u.id = s.user_id
    where s.id = session_id
    and u.last_sign_in_at > now() - interval '30 days'
  ) into valid;
  
  return valid;
end;
$$;

-- Create RLS policies
create policy "Users can only access their own sessions"
  on auth.sessions
  for all
  using (auth.uid() = user_id);

-- Grant necessary permissions
grant execute on function auth.cleanup_expired_sessions to service_role;
grant execute on function auth.validate_session to service_role;

-- Create index for performance
create index if not exists sessions_user_id_idx 
  on auth.sessions(user_id);

-- Trigger for automatic cleanup (runs daily)
create or replace function auth.schedule_session_cleanup()
returns trigger
language plpgsql
security definer
as $$
begin
  perform auth.cleanup_expired_sessions();
  return new;
end;
$$;

create trigger cleanup_expired_sessions_trigger
  after insert or update
  on auth.sessions
  execute procedure auth.schedule_session_cleanup(); 