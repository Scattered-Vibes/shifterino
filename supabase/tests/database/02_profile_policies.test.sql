begin;
  select plan(4);

  -- Test profile update policies
  select tests.create_supabase_user('test_user');
  
  -- Insert test employee
  insert into public.employees (id, auth_id, first_name, last_name, email, role)
  values (
    gen_random_uuid(),
    tests.get_supabase_uid('test_user'),
    'John',
    'Doe',
    'test@example.com',
    'dispatcher'
  );

  -- Test user can update own profile
  select lives_ok(
    $$
    update employees
    set first_name = 'Jane'
    where auth_id = tests.get_supabase_uid('test_user')
    $$,
    'users can update their own profile'
  );

  -- Test user cannot update other profiles
  select throws_ok(
    $$
    update employees
    set first_name = 'Jane'
    where auth_id != tests.get_supabase_uid('test_user')
    $$,
    'users cannot update other profiles'
  );

  select * from finish();
rollback; 