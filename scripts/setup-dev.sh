#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting development environment setup..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if environment variables are set
if [ ! -f .env.local ]; then
    echo "⚠️ .env.local file not found. Creating from example..."
    cp .env.example .env.local
    echo "⚙️ Please update .env.local with your configuration"
    exit 1
fi

# Start Supabase
echo "🔄 Starting Supabase..."
supabase stop || true # Stop any running instance
supabase start

# Wait for Supabase to be ready
echo "⏳ Waiting for Supabase to be ready..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if supabase status | grep "Database" | grep "online" > /dev/null 2>&1; then
        echo "✅ Supabase is ready!"
        break
    fi
    echo "⏳ Waiting... ($attempt/$max_attempts)"
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Failed to start Supabase after $max_attempts attempts"
    exit 1
fi

# Run database setup
echo "🗃️ Setting up database..."
npx tsx scripts/setup-db.ts

# Verify the setup
echo "🔍 Verifying setup..."

# Check database connection
echo "📊 Testing database connection..."
if ! supabase db reset --dry-run > /dev/null 2>&1; then
    echo "❌ Database connection failed"
    exit 1
fi
echo "✅ Database connection verified"

# Check auth service
echo "🔐 Testing auth service..."
if ! curl -s "http://localhost:54321/auth/v1/health" > /dev/null; then
    echo "❌ Auth service is not responding"
    exit 1
fi
echo "✅ Auth service verified"

# Final setup message
echo "
✨ Development environment setup complete!

🔑 Test Credentials:
   Manager:    manager@example.com / Password@123
   Supervisor: supervisor@example.com / Password@123
   Dispatcher: dispatcher@example.com / Password@123

🌐 Local URLs:
   Studio:    http://localhost:54323
   API:       http://localhost:54321
   Database:  postgresql://postgres:postgres@localhost:54322/postgres

📝 Next steps:
   1. Start the development server: npm run dev
   2. Open Studio: http://localhost:54323
"

# Ask to start dev server
read -p "Would you like to start the development server now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting Next.js development server..."
    npm run dev
fi 