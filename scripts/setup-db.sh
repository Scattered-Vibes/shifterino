#!/bin/bash

# Exit on error
set -e

echo "🔄 Starting database setup..."

# Check if Supabase is running
echo "📊 Checking Supabase status..."
supabase status

# Reset the database
echo "🗑️ Resetting database..."
supabase db reset

# Verify the database schema
echo "🔍 Verifying database schema..."
supabase db lint

# Verify the test users
echo "👥 Verifying test users..."
supabase db query "
SELECT 
    email,
    role,
    email_confirmed_at,
    CASE 
        WHEN encrypted_password IS NOT NULL THEN 'SET'
        ELSE 'MISSING'
    END as password_status,
    raw_app_meta_data->>'role' as app_role
FROM auth.users 
WHERE email LIKE '%@example.com';"

# Verify the employees
echo "👤 Verifying employees..."
supabase db query "
SELECT 
    e.email,
    e.role,
    e.shift_pattern,
    CASE 
        WHEN u.id IS NOT NULL THEN 'LINKED'
        ELSE 'UNLINKED'
    END as auth_status
FROM public.employees e
LEFT JOIN auth.users u ON e.auth_id = u.id
WHERE e.email LIKE '%@example.com';"

# Verify RLS policies
echo "🔒 Verifying RLS policies..."
supabase db query "
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;"

echo "✅ Database setup complete!"

# Test login with manager account
echo "🔑 Testing manager login..."
curl -X POST "http://localhost:54321/auth/v1/token?grant_type=password" \
     -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"manager@example.com\",\"password\":\"Password@123\"}" \
     | jq '.' 