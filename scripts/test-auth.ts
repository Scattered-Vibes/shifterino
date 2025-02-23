import './test-setup'
import { createTestUser, deleteTestUser } from '../lib/utils/test-user'
import { createClient } from '@supabase/supabase-js'
import { authDebug } from '../lib/utils/auth-debug'

async function testAuthFlow() {
  try {
    console.log('Starting authentication flow test...')
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    // Create test user
    const testUser = await createTestUser({
      email: 'auth-test@example.com',
      password: 'test123!',
      role: 'dispatcher',
      firstName: 'Auth',
      lastName: 'Test',
      employeeId: 'AUTH001',
      shiftPattern: '4x10',
      preferredShiftCategory: 'day'
    })

    console.log('Test user created:', testUser.credentials.email)

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Test sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUser.credentials.email,
      password: testUser.credentials.password
    })

    if (signInError) {
      throw new Error(`Sign in failed: ${signInError.message}`)
    }

    console.log('Sign in successful')

    // Verify session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      throw new Error(`Session verification failed: ${sessionError?.message || 'No session found'}`)
    }

    console.log('Session verified')

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('employees')
      .select('*')
      .eq('email', testUser.credentials.email)
      .single()

    if (userError) {
      throw new Error(`Failed to fetch user data: ${userError.message}`)
    }

    console.log('User data fetched:', {
      email: userData.email,
      role: userData.role,
      employeeId: userData.employee_id
    })

    // Clean up
    await deleteTestUser(testUser.credentials.email)
    console.log('Test user deleted')

    console.log('Authentication flow test completed successfully')
  } catch (error) {
    console.error('Authentication flow test failed:', error)
    throw error
  }
}

testAuthFlow().catch(error => {
  console.error('Test failed:', error)
  process.exit(1)
}) 