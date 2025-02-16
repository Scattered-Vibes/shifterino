import { execSync } from 'child_process'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ANSI color codes for pretty console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m'
} as const

// Test users to be created
const testUsers = [
  {
    email: 'manager@dispatch911.com',
    password: 'Manager@123',
    userData: {
      first_name: 'Mike',
      last_name: 'Manager',
      role: 'manager' as const,
      shift_pattern: '4_10' as const,
    },
  },
  {
    email: 'supervisor1@dispatch911.com',
    password: 'Supervisor@123',
    userData: {
      first_name: 'Sarah',
      last_name: 'Supervisor',
      role: 'supervisor' as const,
      shift_pattern: '3_12_4' as const,
    },
  },
  {
    email: 'dispatcher1@dispatch911.com',
    password: 'Dispatcher@123',
    userData: {
      first_name: 'David',
      last_name: 'Dispatcher',
      role: 'dispatcher' as const,
      shift_pattern: '4_10' as const,
    },
  },
  {
    email: 'dispatcher2@dispatch911.com',
    password: 'Dispatcher@123',
    userData: {
      first_name: 'Diana',
      last_name: 'Day',
      role: 'dispatcher' as const,
      shift_pattern: '4_10' as const,
    },
  },
  {
    email: 'dispatcher3@dispatch911.com',
    password: 'Dispatcher@123',
    userData: {
      first_name: 'Sam',
      last_name: 'Swing',
      role: 'dispatcher' as const,
      shift_pattern: '3_12_4' as const,
    },
  },
  {
    email: 'dispatcher4@dispatch911.com',
    password: 'Dispatcher@123',
    userData: {
      first_name: 'Nina',
      last_name: 'Night',
      role: 'dispatcher' as const,
      shift_pattern: '3_12_4' as const,
    },
  },
]

// Utility functions
function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logStep(step: string) {
  log(`\n=== ${step} ===`, 'blue')
}

function logSuccess(message: string) {
  log(`✓ ${message}`, 'green')
}

function logError(message: string, error: unknown) {
  log(`✗ ${message}`, 'red')
  if (error instanceof Error) {
    console.error(`${colors.red}${error.message}${colors.reset}`)
  } else {
    console.error(`${colors.red}${error}${colors.reset}`)
  }
}

// Load environment variables
function loadEnvVars() {
  const envPath = path.resolve(__dirname, '../.env.local')
  if (!fs.existsSync(envPath)) {
    console.warn('No .env.local found, using default Supabase connection details')
  }
  dotenv.config({ path: envPath })
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }
}

// Initialize Supabase client
function createSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  )
}

// Reset database and run migrations
async function resetDatabase() {
  logStep('Resetting Database')
  try {
    execSync('npx supabase db reset', { stdio: 'inherit' })
    logSuccess('Database reset completed')
  } catch (error) {
    logError('Failed to reset database', error)
    throw error
  }
}

// Create test users
async function createTestUsers(supabase: ReturnType<typeof createSupabaseClient>) {
  logStep('Creating Test Users')
  
  for (const user of testUsers) {
    try {
      log(`Creating user: ${user.email}`, 'yellow')
      
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.userData
      })

      if (error) throw error
      if (!data.user) throw new Error('No user data returned')

      logSuccess(`Created user: ${data.user.email} (ID: ${data.user.id})`)
    } catch (error) {
      logError(`Failed to create user ${user.email}`, error)
      throw error
    }
  }
}

// Main setup function
async function setup() {
  try {
    logStep('Starting Database Setup')
    
    // Load environment variables
    loadEnvVars()
    
    // Reset database and run migrations
    await resetDatabase()
    
    // Initialize Supabase client
    const supabase = createSupabaseClient()
    
    // Create test users
    await createTestUsers(supabase)
    
    logSuccess('\nDatabase setup completed successfully')
    process.exit(0)
    
  } catch (error) {
    logError('\nDatabase setup failed', error)
    process.exit(1)
  }
}

// Run setup if this script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  setup()
}

// Export for programmatic usage
export { setup } 