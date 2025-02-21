import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AppError, ErrorCode } from '@/lib/errors'
import type { Database } from '@/types/supabase/database'
import type { User } from '@supabase/supabase-js'
import { generateLogMessage } from '@/lib/utils/logging'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Employee, EmployeeRole, ShiftPattern } from '@/types/models/employee'

export type UserRole = Employee['role']

// Types for authenticated user data
export interface AuthenticatedUser {
  userId: string
  employeeId: string
  role: UserRole
  email: string
  isNewUser: boolean
  firstName: string
  lastName: string
  team_id: string
  user_metadata?: {
    first_name: string
    last_name: string
    role: UserRole
    employee_id?: string
    [key: string]: any
  }
}

// Get the server-side Supabase client
function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.warn('[Cookie] Set failed:', error instanceof Error ? error.message : String(error))
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          } catch (error) {
            console.warn('[Cookie] Remove failed:', error instanceof Error ? error.message : String(error))
          }
        },
      },
    }
  )
}

// Get the current user with error handling
async function getUser(): Promise<User | null> {
  const supabase = createServerSupabaseClient()

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('[getUser] Auth error:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('[getUser] Error:', error)
    return null
  }
}

/**
 * Require authentication and return user data
 * @param allowIncomplete - Whether to allow incomplete profiles
 * @returns AuthenticatedUser object with user and employee data
 * @throws AppError if authentication fails or employee data cannot be fetched
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[requireAuth:${requestId}] Starting authentication check`, {
    timestamp: new Date().toISOString(),
    cookies: cookies().getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
  })

  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.log(`[requireAuth:${requestId}] Auth check failed`, {
      error: userError ? { message: userError.message, status: userError.status } : 'No user found'
    })

    // Clear invalid session
    if (userError?.status === 403) {
      console.log(`[requireAuth:${requestId}] Invalid session, clearing cookies`)
      await supabase.auth.signOut()
      cookies().delete('sb-localhost-auth-token')
      cookies().delete('sb-127-auth-token')
    }

    throw redirect('/login')
  }

  try {
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (employeeError || !employee) {
      console.error(`[requireAuth:${requestId}] Failed to fetch employee data:`, employeeError)
      throw new AppError('Failed to fetch employee data', ErrorCode.DATABASE)
    }

    console.log(`[requireAuth:${requestId}] Authentication successful`, {
      userId: user.id,
      email: user.email,
      role: employee.role
    })

    return {
      userId: user.id,
      employeeId: employee.id,
      role: employee.role,
      email: employee.email,
      isNewUser: false,
      firstName: employee.first_name,
      lastName: employee.last_name,
      team_id: employee.team_id || '',
      user_metadata: {
        first_name: employee.first_name,
        last_name: employee.last_name,
        role: employee.role,
        employee_id: employee.id
      }
    }
  } catch (error) {
    console.error(`[requireAuth:${requestId}] Unexpected error:`, error)
    throw error
  }
}

// Helper to require manager role
export async function requireManager(): Promise<AuthenticatedUser> {
  console.log('[requireManager] Starting manager role check')
  
  try {
    const auth = await requireAuth()
    console.log('[requireManager] Auth check passed:', {
      userId: auth.userId,
      email: auth.email,
      metadata: auth.user_metadata
    })

    if (auth.role !== 'manager') {
      console.warn('[requireManager] User is not a manager:', {
        userId: auth.userId,
        userEmail: auth.email,
        role: auth.role
      })
      throw new AppError(
        'Manager role required',
        ErrorCode.FORBIDDEN
      )
    }

    console.log('[requireManager] Manager role verified:', {
      userId: auth.userId,
      userEmail: auth.email,
      role: auth.role
    })

    return auth
  } catch (error) {
    console.error('[requireManager] Unexpected error:', {
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    })
    throw error
  }
}

// Helper to require supervisor or manager role
export async function requireSupervisor(): Promise<AuthenticatedUser> {
  const auth = await requireAuth()
  
  if (!['supervisor', 'manager'].includes(auth.role)) {
    throw new AppError('Supervisor or manager role required', ErrorCode.FORBIDDEN)
  }
  
  return auth
}

// Checks if the user has one of the allowed roles. Does *not* redirect.
export async function hasRole(roles: UserRole[]): Promise<boolean> {
  try {
    const auth = await requireAuth()
    const hasAllowedRole = roles.includes(auth.role)
    console.log('[hasRole] User role check:', { 
      userRole: auth.role, 
      allowedRoles: roles, 
      hasAccess: hasAllowedRole 
    })
    return hasAllowedRole
  } catch (error) {
    console.error('[hasRole] Error checking role:', error)
    return false
  }
}

export async function verifyTeamAccess(auth: AuthenticatedUser, employeeId: string): Promise<void> {
  if (auth.role === 'manager') return

  const supabase = createServerSupabaseClient()

  const { data: targetEmployee, error: targetError } = await supabase
    .from('employees')
    .select('id, team_id')
    .eq('id', employeeId)
    .single<Pick<Database['public']['Tables']['employees']['Row'], 'id' | 'team_id'>>()

  if (targetError || !targetEmployee) {
    throw new AppError('Employee not found', ErrorCode.NOT_FOUND)
  }

  if (auth.role === 'supervisor') {
    if (auth.team_id !== targetEmployee.team_id) {
      throw new AppError('Access denied: Employee not in your team', ErrorCode.FORBIDDEN)
    }
    return
  }

  throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED)
}

export async function verifyEmployeeAccess(auth: AuthenticatedUser, employeeId: string): Promise<void> {
  if (auth.role === 'manager') return

  if (auth.role === 'supervisor') {
    const supabase = createServerSupabaseClient()
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, team_id')
      .eq('id', employeeId)
      .single<Pick<Database['public']['Tables']['employees']['Row'], 'id' | 'team_id'>>()

    if (employeeError || !employee) {
      throw new AppError('Employee not found', ErrorCode.NOT_FOUND)
    }

    if (auth.team_id !== employee.team_id) {
      throw new AppError('Access denied: Employee not in your team', ErrorCode.FORBIDDEN)
    }
    return
  }

  if (auth.userId !== employeeId) {
    throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED)
  }
}

export async function getEmployee(userId: string) {
  const supabase = await createServerSupabaseClient()
  return await supabase
    .from('employees')
    .select(`
      id,
      auth_id,
      role,
      first_name,
      last_name,
      email,
      created_at,
      created_by,
      updated_at,
      updated_by,
      shift_pattern,
      weekly_hours_cap,
      max_overtime_hours
    `)
    .eq('auth_id', userId)
    .single()
}

export async function hasCompletedProfile(userId: string): Promise<boolean> {
  console.log('[hasCompletedProfile] Checking profile completion for user:', userId)
  const supabase = await createServerSupabaseClient()
  
  try {
    const { data: employee, error } = await supabase
      .from('employees')
      .select('first_name, last_name')
      .eq('auth_id', userId)
      .single()
      
    if (error) throw error
    const isComplete = !!(employee?.first_name && employee?.last_name)
    console.log('[hasCompletedProfile] Profile completion status:', { isComplete, employee })
    return isComplete
  } catch (error) {
    console.error('[hasCompletedProfile] Error checking profile completion:', error)
    return false
  }
}

// Re-export core functions
export * from './core'

/**
 * Get the current user with error handling
 */
export async function getSessionUser(): Promise<User | null> {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[getSessionUser:${requestId}] Starting session check`)
  
  try {
    const supabase = createClient()
    console.log(`[getSessionUser:${requestId}] Calling auth.getUser()`)
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error(`[getSessionUser:${requestId}] Auth error:`, {
        message: error.message,
        status: error.status
      })
      return null
    }
    
    if (!user) {
      console.log(`[getSessionUser:${requestId}] No user found`)
      return null
    }

    console.log(`[getSessionUser:${requestId}] User found:`, {
      id: user.id,
      email: user.email
    })
    
    return user
  } catch (error) {
    console.error(`[getSessionUser:${requestId}] Unexpected error:`, 
      error instanceof Error ? error.message : error
    )
    return null
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[signOut:${requestId}] Starting sign out`)
  
  const supabase = createClient()

  try {
    console.log(`[signOut:${requestId}] Calling auth.signOut()`)
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error(`[signOut:${requestId}] Sign out error:`, error)
      const err = new Error('Failed to sign out')
      err.cause = error
      throw err
    }
    
    console.log(`[signOut:${requestId}] Successfully signed out`)
  } catch (error) {
    console.error(`[signOut:${requestId}] Error:`, error)
    const err = new Error('Failed to sign out')
    err.cause = error
    throw err
  }
}

function mapShiftPattern(pattern: string): 'pattern_a' | 'pattern_b' | 'custom' {
  switch (pattern) {
    case '4x10':
      return 'pattern_a'
    case '3x12_plus_4':
      return 'pattern_b'
    default:
      return 'custom'
  }
}

const testUsers = [
  {
    email: 'manager@example.com',
    password: 'Password@123',
    firstName: 'Test',
    lastName: 'Manager',
    role: 'manager' as const,
    shiftPattern: '4x10' as const
  },
  {
    email: 'supervisor@example.com',
    password: 'Password@123',
    firstName: 'Test',
    lastName: 'Supervisor',
    role: 'supervisor' as const,
    shiftPattern: '3x12_plus_4' as const
  },
  {
    email: 'dispatcher@example.com',
    password: 'Password@123',
    firstName: 'Test',
    lastName: 'Dispatcher',
    role: 'dispatcher' as const,
    shiftPattern: '4x10' as const
  }
]

export async function createTestUsers() {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[createTestUsers:${requestId}] Starting test user creation`)

  try {
    const results = []

    for (const testUser of testUsers) {
      console.log(`[createTestUsers:${requestId}] Processing user: ${testUser.email}`)

      let userData = null

      // Try to create the user
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          first_name: testUser.firstName,
          last_name: testUser.lastName,
          role: testUser.role,
          shift_pattern: testUser.shiftPattern,
        },
      })

      if (error) {
        // If user exists, try to get existing user
        if (error.message.includes('User already registered')) {
          console.log(`[createTestUsers:${requestId}] User ${testUser.email} already exists, fetching details`)
          const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers()

          if (searchError || !existingUsers?.users) {
            console.error(`[createTestUsers:${requestId}] Error fetching existing user:`, searchError)
            continue
          }

          const existingUser = existingUsers.users.find(user => user.email === testUser.email)

          if (!existingUser) {
            console.error(`[createTestUsers:${requestId}] User with email ${testUser.email} was not found`)
            continue
          }
          userData = existingUser
        } else {
          console.error(`[createTestUsers:${requestId}] Error creating user ${testUser.email}:`, error)
          continue
        }
      } else {
        userData = data.user
      }

      if (userData?.id) {
        console.log(`[createTestUsers:${requestId}] Creating/updating employee record for ${testUser.email}`)

        const now = new Date().toISOString()

        // Get the preferred shift category based on shift pattern
        const preferred_shift_category = testUser.shiftPattern === '4x10' ? 'day' : 'swing'

        // Create employee insert data with correct types
        const employeeData = {
          auth_id: userData.id,
          email: testUser.email,
          first_name: testUser.firstName,
          last_name: testUser.lastName,
          role: testUser.role,
          shift_pattern: testUser.shiftPattern,
          default_weekly_hours: 40,
          weekly_hours_cap: 40,
          max_overtime_hours: 0,
          overtime_hours: 0,
          profile_incomplete: false,
          preferred_shift_category,
          organization_id: '00000000-0000-0000-0000-000000000002',
          team_id: '00000000-0000-0000-0000-000000000001',
          created_at: now,
          updated_at: now,
          created_by: userData.id,
          updated_by: userData.id
        } as const

        // Perform the upsert
        const { data: newEmployee, error: employeeError } = await supabaseAdmin
          .from('employees')
          .upsert(employeeData)
          .select('id')
          .single()

        if (employeeError) {
          console.error(
            `[createTestUsers:${requestId}] Employee creation error for ${testUser.email}:`,
            employeeError
          )
          continue
        }

        if (!newEmployee?.id) {
          console.error(`[createTestUsers:${requestId}] No employee ID returned for ${testUser.email}`)
          continue
        }

        // Update user metadata with employee ID
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userData.id,
          {
            user_metadata: {
              ...userData.user_metadata,
              employee_id: newEmployee.id,
            }
          }
        )

        if (updateError) {
          console.error(`[createTestUsers:${requestId}] Error updating user metadata for ${testUser.email}:`, updateError)
          continue
        }

        results.push({
          email: testUser.email,
          userId: userData.id,
          employeeId: newEmployee.id,
          success: true,
        })
      }
    }

    console.log(`[createTestUsers:${requestId}] Completed creating test users:`, results)
    return { data: results, error: null }
  } catch (error) {
    console.error(`[createTestUsers:${requestId}] Unexpected error:`, error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    }
  }
}

export async function getServerUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getServerSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
} 