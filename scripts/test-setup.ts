import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({
  path: resolve(process.cwd(), '.env.local')
})

// Verify required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

console.log('Environment variables loaded successfully')
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL) 