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

type TestUser = {
  email: string
  password: string
  first_name: string
  last_name: string
  role: Database['public']['Enums']['employee_role']
  shift_pattern: Database['public']['Enums']['shift_pattern']
  preferred_shift_category: Database['public']['Enums']['shift_category']
}

const testUsers: TestUser[] = [
  {
    email: 'manager@dispatch911.com',
    password: 'Manager@123',
    first_name: 'Mike',
    last_name: 'Manager',
    role: 'manager',
    shift_pattern: '4_10',
    preferred_shift_category: 'DAY'
  },
  {
    email: 'supervisor1@dispatch911.com',
    password: 'Super@123',
    first_name: 'Sarah',
    last_name: 'Supervisor',
    role: 'supervisor',
    shift_pattern: '3_12_4',
    preferred_shift_category: 'SWING'
  },
  {
    email: 'dispatcher1@dispatch911.com',
    password: 'Dispatch@123',
    first_name: 'David',
    last_name: 'Dispatcher',
    role: 'dispatcher',
    shift_pattern: '4_10',
    preferred_shift_category: 'NIGHT'
  },
]

async function createTestUsers() {
  try {
    for (const user of testUsers) {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          shift_pattern: user.shift_pattern,
          preferred_shift_category: user.preferred_shift_category,
          profile_incomplete: true
        }
      })

      if (authError) {
        console.error(`Error creating user ${user.email}:`, authError)
        continue
      }

      console.log(`Created user ${user.email} with ID ${authData.user.id}`)
    }

    console.log('Test users created successfully')
  } catch (error) {
    console.error('Error creating test users:', error)
  }
}

// Run the script
createTestUsers()
  .catch(error => {
    console.error('\x1b[31mFatal error:', error, '\x1b[0m')
    process.exit(1)
  })
  .finally(() => {
    console.log('\x1b[34m=== Finished creating test users ===\x1b[0m')
    process.exit()
  }) 