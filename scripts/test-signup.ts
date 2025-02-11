import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSignup() {
  try {
    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email: 'test.dispatcher@shifterino.com',
      password: 'TestPassword123!',
      options: {
        data: {
          first_name: 'Test',
          last_name: 'Dispatcher',
          role: 'DISPATCHER'
        }
      }
    })
    
    if (error) throw error
    console.log('Auth user created:', data)

    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check for employee record
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('email', 'test.dispatcher@shifterino.com')
      .single()
    
    if (employeeError) throw employeeError
    console.log('Employee record created:', employee)

  } catch (error) {
    console.error('Error:', error)
  }
}

testSignup() 