import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/supabase/database'
import type { EmployeeWithAuth } from '@/types/supabase/index'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'

export type UserRole = Database['public']['Tables']['employees']['Row']['role']

export interface AuthenticatedUser {
  userId: string
  employeeId: string
  role: UserRole
  email: string
  isNewUser: boolean
  firstName?: string | null
  lastName?: string | null
}

async function createServerSupabaseClient() {
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

export async function getSessionUser() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('[getSessionUser] Error:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('[getSessionUser] Error:', error)
    return null
  }
}

export async function requireAuth(allowIncomplete = false): Promise<AuthenticatedUser> {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (!user || authError) {
    console.log('User not authenticated, redirecting to login', authError)
    redirect('/login')
  }

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, role, first_name, last_name')
    .eq('auth_id', user.id)
    .single()

  if (employeeError) {
    console.error('Error fetching employee data:', employeeError)
    redirect('/error')
  }

  if (!employee) {
    console.warn('No employee record found for user:', user.id)
    redirect('/complete-profile')
  }

  const isNewUser = !employee.first_name || !employee.last_name

  if (isNewUser && !allowIncomplete) {
    redirect('/complete-profile')
  }

  return {
    userId: user.id,
    employeeId: employee.id,
    role: employee.role as UserRole,
    email: user.email!,
    isNewUser,
    firstName: employee.first_name,
    lastName: employee.last_name
  }
}

export async function requireRole(
  user: AuthenticatedUser,
  roles: UserRole[]
): Promise<void> {
  if (!roles.includes(user.role)) {
    redirect('/unauthorized')
  }
}

export async function requireManager(): Promise<AuthenticatedUser> {
  const user = await requireAuth()
  if (user.role !== 'manager') {
    redirect('/unauthorized')
  }
  return user
}

export async function requireSupervisorOrAbove(): Promise<AuthenticatedUser> {
  const user = await requireAuth()
  if (user.role !== 'manager' && user.role !== 'supervisor') {
    redirect('/unauthorized')
  }
  return user
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