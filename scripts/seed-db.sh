#!/bin/bash
set -e

echo "Starting database seeding process..."

echo "Step 1: Running initial schema and data setup..."
supabase db reset --debug

echo "Waiting for database to be ready..."
max_attempts=60
attempt=1
while [ $attempt -le $max_attempts ]; do
  if PGPASSWORD="postgres" psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT 1" > /dev/null 2>&1; then
    echo "Database is ready!"
    break
  fi
  echo "Waiting... ($attempt/$max_attempts)"
  sleep 2
  attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
  echo "Failed to connect to database after $max_attempts attempts"
  exit 1
fi

echo "Step 2: Setting up roles..."
PGPASSWORD="postgres" psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f ./supabase/seed_roles.sql

echo "Step 3: Creating users..."
npx tsx scripts/generate-users.ts

echo "Step 4: Setting up user relationships..."
PGPASSWORD="postgres" psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f ./supabase/seed_part2.sql

echo "Database seeding complete!" 