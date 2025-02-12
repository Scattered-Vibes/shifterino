import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const testUsers = [
  {
    email: 'manager@dispatch911.test',
    password: 'TESTboy123!',
    first_name: 'Mike',
    last_name: 'Manager',
    role: 'manager'
  },
  {
    email: 'AdambPeterson@gmail.com',
    password: 'ABPsch1313!',
    first_name: 'Adam',
    last_name: 'Peterson',
    role: 'manager'
  },
  {
    email: 'supervisor@dispatch911.test',
    password: 'TESTboy123!',
    first_name: 'Sarah',
    last_name: 'Supervisor',
    role: 'supervisor'
  },
  {
    email: 'dispatcher1@dispatch911.test',
    password: 'TESTboy123!',
    first_name: 'David',
    last_name: 'Day',
    role: 'dispatcher'
  },
  {
    email: 'dispatcher2@dispatch911.test',
    password: 'TESTboy123!',
    first_name: 'Nina',
    last_name: 'Night',
    role: 'dispatcher'
  }
]

async function createTestUsers() {
  console.log('Creating test users...')

  for (const user of testUsers) {
    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email for test users
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        }
      })

      if (authError) {
        console.error(`Error creating user ${user.email}:`, authError.message)
        continue
      }

      console.log(`Created user ${user.email} with ID: ${authData.user.id}`)

      // Create corresponding employee record
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          auth_id: authData.user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          shift_pattern: user.role === 'dispatcher' ? '4_10' : null,
          preferred_shift_category: 'DAY',
          weekly_hours_cap: 40,
          profile_completed: true
        })

      if (employeeError) {
        console.error(`Error creating employee record for ${user.email}:`, employeeError.message)
        continue
      }

      console.log(`Created employee record for ${user.email}`)
    } catch (error) {
      console.error(`Unexpected error creating user ${user.email}:`, error)
    }
  }

  console.log('Finished creating test users')
}

// Run the script
createTestUsers()
  .catch(console.error)
  .finally(() => process.exit()) 