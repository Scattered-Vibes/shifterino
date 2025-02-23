import { createClient } from '@supabase/supabase-js'
import { authDebug } from './auth-debug'

interface TestUser {
  email: string
  password: string
  role: 'dispatcher' | 'supervisor'
  firstName: string
  lastName: string
  shiftPattern: '4x10' | '3x12'
  employeeId?: string
  preferredShiftCategory?: 'early' | 'day' | 'swing' | 'graveyard'
}

const defaultTestUser: TestUser = {
  email: 'test@example.com',
  password: 'password123',
  role: 'dispatcher',
  firstName: 'Test',
  lastName: 'User',
  shiftPattern: '4x10',
  employeeId: 'TEST001',
  preferredShiftCategory: 'day'
}

export async function createTestUser(options: Partial<TestUser> = {}) {
  const user = { ...defaultTestUser, ...options }
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    authDebug.debug('Creating test user', {
      email: user.email,
      role: user.role,
      employeeId: user.employeeId
    })

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: user.employeeId
      }
    })

    if (authError) {
      authDebug.error('Failed to create auth user', authError, { user })
      throw authError
    }

    authDebug.info('Auth user created', {
      userId: authUser.user.id,
      email: authUser.user.email,
      employeeId: user.employeeId
    })

    // Create employee record
    const { error: employeeError } = await supabase
      .from('employees')
      .insert({
        auth_id: authUser.user.id,
        email: user.email,
        employee_id: user.employeeId || `EMP${authUser.user.id.split('-')[0]}`,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        shift_pattern: user.shiftPattern,
        preferred_shift_category: user.preferredShiftCategory || 'day',
        weekly_hours_cap: 40,
        max_overtime_hours: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (employeeError) {
      authDebug.error('Failed to create employee record', employeeError, {
        userId: authUser.user.id,
        email: user.email,
        employeeId: user.employeeId
      })
      
      // Cleanup auth user on failure
      await supabase.auth.admin.deleteUser(authUser.user.id)
      throw employeeError
    }

    authDebug.info('Test user created successfully', {
      userId: authUser.user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId
    })

    return {
      user: authUser.user,
      credentials: {
        email: user.email,
        password: user.password
      }
    }
  } catch (error) {
    authDebug.error('Unexpected error creating test user', error as Error, { user })
    throw error
  }
}

export async function deleteTestUser(email: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    authDebug.debug('Deleting test user', { email })

    // Get user by email
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError) {
      authDebug.error('Failed to find user for deletion', userError, { email })
      throw userError
    }

    // Delete auth user (will cascade to employee record)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

    if (deleteError) {
      authDebug.error('Failed to delete user', deleteError, { email, userId: user.id })
      throw deleteError
    }

    authDebug.info('Test user deleted successfully', { email, userId: user.id })
  } catch (error) {
    authDebug.error('Unexpected error deleting test user', error as Error, { email })
    throw error
  }
} 