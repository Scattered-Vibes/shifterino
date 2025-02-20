import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'
import type { Employee, EmployeeRole } from '@/types/models/employee'

export type UserRole = EmployeeRole

export interface AuthenticatedUser {
  user: User
  employee: Employee
  role: UserRole
  isComplete: boolean
}

// Authenticates the user and fetches employee data.
// Throws an error if authentication fails or employee data is incomplete.
export async function requireAuth(allowIncomplete = false): Promise<AuthenticatedUser> {
  const supabase = createClient()

  // Get authenticated user using the server client
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error(`[requireAuth] Authentication error:`, userError)
    redirect('/login')
  }

  // TEMPORARILY REMOVE ROLE AND PROFILE CHECK FOR DEBUGGING
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('*')
    .eq('auth_id', user.id)
    .single<Employee>()

  if (employeeError || !employee) {
    console.error(`[requireAuth] Employee Fetch Error:`, employeeError)
    throw new AppError(
      'Failed to retrieve employee data.',
      ErrorCode.NOT_FOUND,
      { error: employeeError }
    )
  }

  const isComplete = Boolean(
    employee.first_name?.trim() &&
    employee.last_name?.trim() &&
    !user.user_metadata?.profile_incomplete
  )

  if (!isComplete && !allowIncomplete) {
    redirect('/complete-profile')
  }

  // Construct the authenticated user object
  const authenticatedUser: AuthenticatedUser = {
    user,
    employee: employee as Employee,
    role: employee.role as UserRole,
    isComplete,
  }

  return authenticatedUser
}

export async function requireRole(requiredRole: UserRole): Promise<AuthenticatedUser> {
  const authResult = await requireAuth()
  if (authResult.role !== requiredRole) {
    throw new AppError("Unauthorized", ErrorCode.FORBIDDEN)
  }
  return authResult
}

export async function requireManager(): Promise<AuthenticatedUser> {
  return requireRole('manager')
}

export async function requireSupervisorOrAbove(): Promise<AuthenticatedUser> {
  const auth = await requireAuth()
  if (auth.role !== 'manager' && auth.role !== 'supervisor') {
    throw new AppError("Unauthorized: Supervisor or Manager role required", ErrorCode.FORBIDDEN)
  }
  return auth
}

export async function verifyTeamAccess(auth: AuthenticatedUser, employeeId: string): Promise<void> {
  if (auth.role === 'manager') return

  const supabase = createClient()
  const { data: targetEmployee, error: fetchError } = await supabase
    .from('employees')
    .select('team_id')
    .eq('id', employeeId)
    .single()

  if (fetchError) throw new AppError('Error fetching employee for access check', ErrorCode.DATABASE, { cause: fetchError })
  if (!targetEmployee) throw new AppError('Employee not found', ErrorCode.NOT_FOUND)

  if (auth.role === 'supervisor' && auth.employee.team_id !== targetEmployee.team_id) {
    throw new AppError('Access denied: Employee not in your team', ErrorCode.FORBIDDEN)
  }
}

export async function verifyEmployeeAccess(auth: AuthenticatedUser, employeeId: string): Promise<void> {
  if (auth.role === 'manager') return

  if (auth.role === 'supervisor') {
    const supabase = createClient()
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('team_id')
      .eq('id', employeeId)
      .single()

    if (employeeError || !employee) throw new AppError("Employee not found", ErrorCode.NOT_FOUND)
    if (auth.employee.team_id !== employee.team_id) throw new AppError('Access denied: Employee not in your team', ErrorCode.FORBIDDEN)
    return
  }

  if (auth.employee.id !== employeeId) {
    throw new AppError('Access denied: You can only access your own data', ErrorCode.FORBIDDEN)
  }
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    return !!await requireAuth()
  } catch {
    return false
  }
}

export async function getUserId(): Promise<string | null> {
  try {
    return (await requireAuth()).user.id
  } catch {
    return null
  }
}

export async function getUserEmail(): Promise<string | null> {
  try {
    return (await requireAuth()).user.email ?? null
  } catch {
    return null
  }
}