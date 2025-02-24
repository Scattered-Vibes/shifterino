#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting development environment setup..."

# Function to load environment variables
load_env() {
    local env_file=$1
    if [ -f "$env_file" ]; then
        echo "Loading environment variables from $env_file"
        set -a
        source "$env_file"
        set +a
    else
        echo "❌ $env_file not found"
        return 1
    fi
}

# Check and create .env.local if needed
if [ ! -f .env.local ]; then
    if [ ! -f .env.example ]; then
        echo "❌ Neither .env.local nor .env.example exist"
        exit 1
    fi
    echo "Creating .env.local from .env.example"
    cp .env.example .env.local
    echo "⚠️ Please edit .env.local with your Supabase credentials before continuing"
    exit 1
fi

# Load environment variables
if ! load_env .env.local; then
    echo "❌ Failed to load environment variables"
    exit 1
fi

# Validate environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set in .env.local"
    echo "Please add it in this format: NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in .env.local"
    echo "Please add your Supabase anon key to .env.local"
    exit 1
fi

if [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "❌ SUPABASE_PROJECT_ID is not set in .env.local"
    echo "Please add your Supabase project ID to .env.local"
    echo "Format: SUPABASE_PROJECT_ID=dvnzmtowppsbfxkwgnod"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "⚠️ SUPABASE_SERVICE_ROLE_KEY is not set in .env.local"
    echo "Some features may not work without the service role key"
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed. Installing..."
    brew install supabase/tap/supabase
fi

# Check for existing Supabase instance
if docker ps --format '{{.Names}}' | grep -q 'supabase'; then
  echo "⚠️  A Supabase instance appears to be already running."
  read -p "Do you want to stop the existing instance and continue? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Exiting..."
    exit 1
  fi
  supabase stop
fi

echo "Starting Supabase..."
supabase start
if [ $? -ne 0 ]; then
    echo "❌ Failed to start Supabase. Please check your Docker setup."
    exit 1
fi

# Get database password if not set
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "Enter your Supabase database password (or leave blank to skip):"
    read -s SUPABASE_DB_PASSWORD
    echo
fi

# Link project with retry logic
echo "Linking project..."
max_retries=3
retry_count=0
while [ $retry_count -lt $max_retries ]; do
    link_cmd="supabase link --project-ref \"$SUPABASE_PROJECT_ID\""
    if [ ! -z "$SUPABASE_DB_PASSWORD" ]; then
        link_cmd="$link_cmd --password \"$SUPABASE_DB_PASSWORD\""
    fi
    
    if eval "$link_cmd"; then
        echo "✅ Project linked successfully"
        break
    else
        retry_count=$((retry_count+1))
        if [ $retry_count -eq $max_retries ]; then
            echo "❌ Failed to link project after $max_retries attempts"
            echo "Try running: supabase link --project-ref \"$SUPABASE_PROJECT_ID\" --debug"
            exit 1
        fi
        echo "Retrying project link (attempt $retry_count of $max_retries)..."
        if [ $retry_count -eq 1 ] && [ -z "$SUPABASE_DB_PASSWORD" ]; then
            echo "Enter database password (or leave blank to skip):"
            read -s SUPABASE_DB_PASSWORD
            echo
        fi
        sleep 2
    fi
done

# Run migrations
echo "Running migrations..."
if ! supabase db reset --debug; then
    echo "❌ Failed to run migrations. Please check the migration files."
    exit 1
fi

# Generate types
echo "Generating types..."
if ! npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/supabase/database.ts; then
    echo "❌ Failed to generate types. Please check your Supabase connection."
    exit 1
fi

# Run create-test-users script
echo "Creating test users..."
if ! npx tsx scripts/create-test-users.ts; then
    echo "❌ Failed to create test users."
    exit 1
fi

echo "✅ Development environment setup complete!"
echo "Project ID: $SUPABASE_PROJECT_ID"
echo "Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"

# Ask to start dev server
read -p "Would you like to start the development server now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting Next.js development server..."
    npm run dev
fi 