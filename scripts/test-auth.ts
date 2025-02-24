import './test-setup'
import { createTestUser, deleteTestUser } from '../lib/utils/test-user'
import { createClient } from '@supabase/supabase-js'
import logger from '../lib/utils/logger'
import { Database } from '../types/supabase/database'

async function testAuthFlow(email?: string, password?: string) {
  try {
    logger.info('Starting authentication flow test...')

    // Use provided credentials or defaults
    const testEmail = email || 'testuser@example.com'
    const testPassword = password || 'testpassword'

    // Create a test user
    await createTestUser(testEmail, testPassword)

    // Create a Supabase client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Sign in with the test user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    if (signInError) {
      throw signInError
    }

    logger.info({ email: signInData.user?.email }, 'User signed in')

    // Assertions after sign-in
    if (!signInData.user) {
      throw new Error('User data is null after sign-in')
    }
    if (signInData.user.email !== testEmail) {
      throw new Error(`Expected email to be ${testEmail}, but got ${signInData.user.email}`)
    }

    // Fetch user data from employees table
    const { data: userData, error: userError } = await supabase
      .from('employees')
      .select('*')
      .eq('auth_id', signInData.user.id)
      .single()

    if (userError) {
      throw userError
    }

    logger.info({ userData }, 'Fetched user data')

    // Assertions on fetched user data
    if (!userData) {
      throw new Error('User data not found in employees table')
    }
    if (userData.email !== testEmail) {
      throw new Error(`Expected email to be ${testEmail}, but got ${userData.email}`)
    }
    if (!['dispatcher', 'manager', 'supervisor'].includes(userData.role)) {
      throw new Error(`Unexpected role: ${userData.role}`)
    }

    // Test session data
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      throw sessionError
    }
    if (!session) {
      throw new Error('Session is null after sign-in')
    }

    logger.info('All assertions passed successfully')

    // Delete the test user
    await deleteTestUser(testEmail)
    logger.info('Test user deleted')

  } catch (error) {
    logger.error({ err: error }, 'Test failed')
    throw error
  }
}

// Get email and password from command-line arguments
const emailArg = process.argv[2]
const passwordArg = process.argv[3]

testAuthFlow(emailArg, passwordArg).catch(error => {
  logger.error({ err: error }, 'Test failed')
  process.exit(1)
}) 