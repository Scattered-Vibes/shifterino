import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import type { Database } from '@/types/supabase/database'

// Load environment variables from .env.local
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

// Initialize Supabase client with service role key
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const testUsers = [
  {
    email: 'manager@dispatch911.com',
    password: 'Manager@123',
    userData: {
      first_name: 'Mike',
      last_name: 'Manager',
      role: 'manager',
      shift_pattern: '4x10',
    },
  },
  {
    email: 'supervisor@dispatch911.com',
    password: 'Supervisor@123',
    userData: {
      first_name: 'Sarah',
      last_name: 'Supervisor',
      role: 'supervisor',
      shift_pattern: '3x12_plus_4',
    },
  },
  {
    email: 'dispatcher1@dispatch911.com',
    password: 'Dispatcher@123',
    userData: {
      first_name: 'David',
      last_name: 'Dispatcher',
      role: 'dispatcher',
      shift_pattern: '4x10',
    },
  },
  {
    email: 'dispatcher2@dispatch911.com',
    password: 'Dispatcher@123',
    userData: {
      first_name: 'Diana',
      last_name: 'Day',
      role: 'dispatcher',
      shift_pattern: '4x10',
    },
  },
  {
    email: 'dispatcher3@dispatch911.com',
    password: 'Dispatcher@123',
    userData: {
      first_name: 'Sam',
      last_name: 'Swing',
      role: 'dispatcher',
      shift_pattern: '3x12_plus_4',
    },
  },
  {
    email: 'dispatcher4@dispatch911.com',
    password: 'Dispatcher@123',
    userData: {
      first_name: 'Nina',
      last_name: 'Night',
      role: 'dispatcher',
      shift_pattern: '3x12_plus_4',
    },
  },
]

async function createTestUsers() {
  try {
    for (const user of testUsers) {
      const { data: existingUser, error: checkError } = await supabase
        .from('employees')
        .select('email')
        .eq('email', user.email)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`Error checking user ${user.email}:`, checkError)
        continue
      }

      if (existingUser) {
        console.log(`User ${user.email} already exists, skipping...`)
        continue
      }

      const { data: _data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.userData,
      })

      if (error) {
        console.error(`Error creating user ${user.email}:`, error)
      } else {
        console.log(`Created user ${user.email} successfully`)
      }
    }
  } catch (error) {
    console.error('Error in createTestUsers:', error)
  }
}

// Run the script
createTestUsers()
  .then(() => {
    console.log('Finished creating test users')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  }) 