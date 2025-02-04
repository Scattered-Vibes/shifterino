-- Enable RLS on employees table
alter table employees enable row level security;

-- Allow users to read their own employee record
create policy "Users can view own employee record"
on employees for select
using (auth.uid() = auth_id);

-- Allow new user registration
create policy "Users can insert their own employee record during signup"
on employees for insert
with check (auth.uid() = auth_id);

-- Allow users to update their own record
create policy "Users can update own employee record"
on employees for update
using (auth.uid() = auth_id)
with check (auth.uid() = auth_id);

-- Add foreign key constraint if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'employee_auth_id_fkey'
    ) THEN
        alter table employees
        add constraint employee_auth_id_fkey
        foreign key (auth_id)
        references auth.users (id)
        on delete cascade;
    END IF;
END $$;

-- Grant necessary permissions to authenticated users
grant usage on schema public to authenticated;
grant all on employees to authenticated;

-- Allow service role full access
grant usage on schema public to service_role;
grant all on employees to service_role; 