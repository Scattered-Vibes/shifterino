import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/supabase/database'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'
import type { AuthenticatedUser, UserRole } from '@/types/auth'

// Gets the currently authenticated user *and* their employee data.
// Redirects if not authenticated or if employee data is missing.
export async function requireAuth(allowIncomplete = false): Promise<AuthenticatedUser> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error('[requireAuth] Error:', authError)
    redirect('/login') // Redirect to login on auth error
  }

  if (!user) {
    console.log('[requireAuth] No user found')
    redirect('/login') // Redirect if no user
  }

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, role, first_name, last_name, shift_pattern')
    .eq('auth_id', user.id)
    .single()

  if (employeeError) {
    console.error('[requireAuth] Error fetching employee:', employeeError)
    redirect('/error') // Or a more specific error page
  }

  if (!employee) {
    console.warn('[requireAuth] No employee record found for user:', user.id)
    redirect('/complete-profile') // Redirect to complete profile
  }
  
  const isNewUser = !employee.first_name || !employee.last_name
  if (isNewUser && !allowIncomplete) {
    redirect('/complete-profile')
  }

  return {
    userId: user.id,
    employeeId: employee.id,
    role: employee.role,
    email: user.email!, // We know email exists at this point
    isNewUser,
    firstName: employee.first_name,
    lastName: employee.last_name,
    shiftPattern: employee.shift_pattern
  }
}

// Checks if the user has one of the allowed roles. Does *not* redirect.
export async function hasRole(roles: UserRole[]): Promise<boolean> {
  try {
    const user = await requireAuth(true) // Allow incomplete profiles for role check
    return roles.includes(user.role)
  } catch (error) {
    // If any error occurs (e.g., not authenticated), default to not authorized
    return false
  }
}

// Example helper functions for common role checks
export async function requireManager() {
  const user = await requireAuth()
  if (user.role !== 'manager') {
    redirect('/unauthorized')
  }
  return user
}

export async function requireSupervisorOrAbove() {
  const user = await requireAuth()
  if (user.role !== 'manager' && user.role !== 'supervisor') {
    redirect('/unauthorized')
  }
  return user
}

// Supabase client creation
export async function createServerSupabaseClient() {
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
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export async function verifyTeamAccess(auth: AuthenticatedUser, employeeId: string): Promise<void> {
  const supabase = await createServerSupabaseClient()

  const { data: targetEmployee, error: targetError } = await supabase
    .from('employees')
    .select('team_id')
    .eq('id', employeeId)
    .single()

  if (targetError || !targetEmployee) {
    throw new AppError('Employee not found', ErrorCode.NOT_FOUND)
  }

  if (auth.role === 'manager') return

  if (auth.role === 'supervisor') {
    const { data: supervisor, error: supervisorError } = await supabase
      .from('employees')
      .select('team_id')
      .eq('id', auth.employeeId)
      .single()

    if (supervisorError || !supervisor) {
      throw new AppError('Supervisor not found', ErrorCode.NOT_FOUND)
    }

    if (supervisor.team_id !== targetEmployee.team_id) {
      throw new AppError('Unauthorized', ErrorCode.FORBIDDEN)
    }

    return
  }

  throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED)
}

export async function verifyEmployeeAccess(auth: AuthenticatedUser, employeeId: string): Promise<void> {
  if (auth.role === 'manager') return

  if (auth.role === 'supervisor') {
    const supabase = await createServerSupabaseClient()
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('team_id')
      .eq('id', employeeId)
      .single()

    if (employeeError || !employee) {
      throw new AppError('Employee not found', ErrorCode.NOT_FOUND)
    }

    const { data: supervisor, error: supervisorError } = await supabase
      .from('employees')
      .select('team_id')
      .eq('id', auth.employeeId)
      .single()

    if (supervisorError || !supervisor) {
      throw new AppError('Supervisor not found', ErrorCode.NOT_FOUND)
    }

    if (supervisor.team_id !== employee.team_id) {
      throw new AppError('Unauthorized', ErrorCode.FORBIDDEN)
    }

    return
  }

  if (auth.employeeId !== employeeId) {
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