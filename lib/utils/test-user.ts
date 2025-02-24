import { createClient } from '@supabase/supabase-js'
import logger from './logger'
import { Database } from '../../types/supabase/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function createTestUser(email: string, password: string) {
  try {
    logger.info({ email }, 'Creating test user')

    // Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      throw authError
    }

    if (!authData.user) {
      throw new Error('No user data returned from auth creation')
    }

    // Create employee record
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .insert({
        auth_id: authData.user.id,
        email,
        role: 'dispatcher',
        first_name: 'Test',
        last_name: 'User',
        employee_id: `TEST${Math.floor(Math.random() * 1000)}`,
        shift_pattern: '4x10',
        preferred_shift_category: 'day'
      })
      .select()
      .single()

    if (employeeError) {
      throw employeeError
    }

    logger.info({ employeeData }, 'Test user created successfully')
    return employeeData
  } catch (error) {
    logger.error({ err: error }, 'Failed to create test user')
    throw error
  }
}

export async function deleteTestUser(email: string) {
  try {
    logger.info({ email }, 'Deleting test user')

    // Get user by email
    const { data: userData, error: userError } = await supabase
      .from('employees')
      .select('auth_id')
      .eq('email', email)
      .single()

    if (userError) {
      throw userError
    }

    if (!userData?.auth_id) {
      throw new Error('No auth_id found for user')
    }

    // Delete from auth.users (this will cascade to employees due to RLS)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      userData.auth_id
    )

    if (deleteError) {
      throw deleteError
    }

    logger.info('Test user deleted successfully')
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete test user')
    throw error
  }
} 