#!/bin/bash

# Exit on error
set -e

echo "Starting development environment setup..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Start Supabase
echo "Starting Supabase..."
supabase stop || true # Stop any running instance
supabase start

# Wait for Supabase to be ready
echo "Waiting for Supabase to be ready..."
sleep 5

# Run database migrations
echo "Running database migrations..."
supabase db reset

# Run database seeding
echo "Seeding database..."
npx tsx scripts/setup-db.ts

# Generate types
echo "Generating TypeScript types..."
supabase gen types typescript --local > types/supabase/database.ts

echo "Setup complete! Starting Next.js development server..."
npm run dev 