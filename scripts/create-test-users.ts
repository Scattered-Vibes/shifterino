import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: '.env.local' })

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
    role: 'manager',
    shift_pattern: '4_10'
  },
  {
    email: 'AdambPeterson@gmail.com',
    password: 'ABPsch1313!',
    first_name: 'Adam',
    last_name: 'Peterson',
    role: 'manager',
    shift_pattern: '4_10'
  },
  {
    email: 'supervisor@dispatch911.test',
    password: 'TESTboy123!',
    first_name: 'Sarah',
    last_name: 'Supervisor',
    role: 'supervisor',
    shift_pattern: '3_12_4'
  },
  {
    email: 'dispatcher1@dispatch911.test',
    password: 'TESTboy123!',
    first_name: 'David',
    last_name: 'Day',
    role: 'dispatcher',
    shift_pattern: '4_10'
  },
  {
    email: 'dispatcher2@dispatch911.test',
    password: 'TESTboy123!',
    first_name: 'Nina',
    last_name: 'Night',
    role: 'dispatcher',
    shift_pattern: '3_12_4'
  }
]

async function createTestUsers() {
  console.log('Creating test users...')

  for (const user of testUsers) {
    try {
      // Create user with Supabase Auth
      const { data, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          shift_pattern: user.shift_pattern,
          profile_incomplete: true
        },
      })

      if (authError) {
        console.error(`Error creating user ${user.email}:`, authError.message)
        continue
      }

      if (!data.user) {
        console.error(`User data is empty for ${user.email}`)
        continue
      }
      
      console.log(`Created user ${user.email} with ID: ${data.user.id}`)

      // The handle_new_user trigger will create the employee record
      // Just update the role if needed
      const { error: updateError } = await supabase
        .from('employees')
        .update({ role: user.role })
        .eq('auth_id', data.user.id)

      if (updateError) {
        console.error(`Error updating role for ${user.email}:`, updateError.message)
      }
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