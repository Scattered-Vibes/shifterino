import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'
import type { Database } from '@/types/supabase/database'
import type { User } from '@supabase/supabase-js'
import { generateLogMessage } from '@/lib/utils/logging'
import { getServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Employee, EmployeeRole as EmployeeRoleType, ShiftPattern as ShiftPatternType } from '@/types/models/employee'
import { handleError } from '@/lib/utils/error-handler'

type EmployeeRole = EmployeeRoleType
type ShiftPattern = ShiftPatternType

// Types for authenticated user data
export interface AuthenticatedUser {
  id: string
  email: string
  role: EmployeeRole
  employee_id: string
  first_name: string
  last_name: string
  shift_pattern: ShiftPattern
}

/**
 * Require authentication and return user data
 * @returns AuthenticatedUser object with user and employee data
 * @throws AppError if authentication fails or employee data cannot be fetched
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  console.log('[requireAuth] Starting authentication check')
  const supabase = getServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    console.log('[requireAuth] No authenticated user found, redirecting to login')
    redirect('/(auth)/login')
  }

  const userMetadata = user.user_metadata as {
    role: EmployeeRole
    employee_id: string
    first_name: string
    last_name: string
    shift_pattern: ShiftPattern
  }

  if (!userMetadata.role || !userMetadata.employee_id) {
    console.error('[requireAuth] User missing required metadata')
    redirect('/(auth)/login')
  }

  // Verify the employee exists in the database
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, role, shift_pattern')
    .eq('id', userMetadata.employee_id)
    .single()

  if (employeeError || !employee) {
    console.error('[requireAuth] Employee record not found:', employeeError)
    redirect('/(auth)/login')
  }

  // Ensure role matches database
  if (employee.role !== userMetadata.role) {
    console.error('[requireAuth] Role mismatch between auth and database')
    redirect('/(auth)/login')
  }

  return {
    id: user.id,
    email: user.email || '',
    role: userMetadata.role,
    employee_id: userMetadata.employee_id,
    first_name: userMetadata.first_name,
    last_name: userMetadata.last_name,
    shift_pattern: userMetadata.shift_pattern,
  }
}

// Helper to require manager role
export async function requireManager(): Promise<AuthenticatedUser> {
  console.log('[requireManager] Starting manager role check')
  
  const auth = await requireAuth()

  if (auth.role !== 'manager') {
    console.warn('[requireManager] User is not a manager:', {
      userId: auth.id,
      email: auth.email,
      role: auth.role,
    })
    throw new AppError(
      'Manager role required',
      ErrorCode.FORBIDDEN,
      403,
      { userId: auth.id, role: auth.role }
    )
  }

  console.log('[requireManager] Manager role verified:', {
    userId: auth.id,
    email: auth.email,
    role: auth.role,
  })

  return auth
}

// Helper to require supervisor or manager role
export async function requireSupervisor(): Promise<AuthenticatedUser> {
  console.log('[requireSupervisor] Starting supervisor role check')
  const auth = await requireAuth()
  
  if (!['supervisor', 'manager'].includes(auth.role)) {
    console.warn('[requireSupervisor] User is not a supervisor or manager:', {
      userId: auth.id,
      email: auth.email,
      role: auth.role,
    })
    throw new AppError(
      'Supervisor or manager role required',
      ErrorCode.FORBIDDEN,
      403,
      { userId: auth.id, role: auth.role }
    )
  }

  console.log('[requireSupervisor] Supervisor/manager role verified:', {
    userId: auth.id,
    email: auth.email,
    role: auth.role,
  })
  
  return auth
}

// Checks if the user has one of the allowed roles. Does *not* redirect.
export async function hasRole(roles: EmployeeRole[]): Promise<boolean> {
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

  const supabase = getServerClient()

  const { data: targetEmployee, error: targetError } = await supabase
    .from('employees')
    .select('id, role')
    .eq('id', employeeId)
    .single()

  if (targetError || !targetEmployee) {
    throw new AppError('Employee not found', ErrorCode.NOT_FOUND)
  }

  if (auth.role === 'supervisor') {
    // For now, supervisors can access all employees since we don't have team structure
    // TODO: Implement team-based access control when teams are added
    return
  }

  throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED)
}

export async function verifyEmployeeAccess(auth: AuthenticatedUser, employeeId: string): Promise<void> {
  if (auth.role === 'manager') return

  if (auth.role === 'supervisor') {
    const supabase = getServerClient()
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, role')
      .eq('id', employeeId)
      .single()

    if (employeeError || !employee) {
      throw new AppError('Employee not found', ErrorCode.NOT_FOUND)
    }

    // For now, supervisors can access all employees since we don't have team structure
    // TODO: Implement team-based access control when teams are added
    return
  }

  // Regular employees can only access their own data
  if (auth.employee_id !== employeeId) {
    throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED)
  }
}

export async function getEmployee(userId: string) {
  const supabase = getServerClient()
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
  const supabase = getServerClient()
  
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

/**
 * Get the current user with error handling
 */
export async function getSessionUser(): Promise<User | null> {
  const supabase = getServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('[getSessionUser] Auth error:', error.message)
    return null
  }

  return user
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  const supabase = getServerClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('[signOut] Error signing out:', error)
    throw error
  }

  redirect('/(auth)/login')
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
          employee_id: `EMP${userData.id.split('-')[0]}`,
          first_name: testUser.firstName,
          last_name: testUser.lastName,
          role: testUser.role,
          shift_pattern: testUser.shiftPattern,
          preferred_shift_category,
          weekly_hours_cap: 40,
          max_overtime_hours: 0,
          created_at: now,
          updated_at: now
        } as const;

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
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookies().set({ name, value, ...options })
          } catch (error) {
            console.warn('[Cookie] Set failed:', error instanceof Error ? error.message : String(error))
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookies().set({ name, value: '', ...options, maxAge: 0 })
          } catch (error) {
            console.warn('[Cookie] Remove failed:', error instanceof Error ? error.message : String(error))
          }
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getServerSession() {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookies().set({ name, value, ...options })
          } catch (error) {
            console.warn('[Cookie] Set failed:', error instanceof Error ? error.message : String(error))
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookies().set({ name, value: '', ...options, maxAge: 0 })
          } catch (error) {
            console.warn('[Cookie] Remove failed:', error instanceof Error ? error.message : String(error))
          }
        },
      },
    }
  )
  const { data: { session } } = await supabase.auth.getSession()
  return session
} 