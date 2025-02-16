import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { AuthenticatedUser, UserRole } from '@/types/auth'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'

export async function getSessionUser() {
  const supabase = await createServerSupabaseClient()

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('[getSessionUser] Error:', error)
      return null
    }
    
    if (!user) return null
    
    return user
  } catch (error) {
    console.error('[getSessionUser] Error:', error)
    return null
  }
}

export async function requireAuth(allowIncomplete = false): Promise<AuthenticatedUser> {
  const user = await getSessionUser()
  
  if (!user) {
    redirect('/login')
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data: employee, error } = await supabase
      .from('employees')
      .select('id, role, first_name, last_name, shift_pattern')
      .eq('auth_id', user.id)
      .single()

    if (error) {
      console.error('[requireAuth] Error fetching employee:', error)
      throw new AppError(
        'Failed to fetch employee data.',
        ErrorCode.DATABASE,
        { message: error.message }
      )
    }

    if (!employee) {
      redirect('/complete-profile')
    }

    const isNewUser = !employee.first_name || !employee.last_name
    
    if (isNewUser && !allowIncomplete) {
      redirect('/complete-profile')
    }

    return {
      userId: user.id,
      employeeId: employee.id,
      role: employee.role,
      email: user.email!,
      isNewUser,
      firstName: employee.first_name,
      lastName: employee.last_name,
      shiftPattern: employee.shift_pattern
    }
  } catch (error) {
    console.error('[requireAuth] Error:', error)
    if (error instanceof AppError) throw error
    throw new AppError(
      'Authentication failed.',
      ErrorCode.UNAUTHORIZED,
      { message: error instanceof Error ? error.message : 'Unknown error' }
    )
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

export async function verifyAccess(
  user: AuthenticatedUser,
  resourceId: string,
  resourceType: 'employee' | 'shift'
): Promise<boolean> {
  // Managers can access everything
  if (user.role === 'manager') return true

  // Supervisors can access all employee data and shifts
  if (user.role === 'supervisor') return true

  // Regular employees can only access their own data
  if (resourceType === 'employee') {
    if (user.employeeId !== resourceId) {
      throw new AppError(
        'Access denied: You can only access your own data',
        ErrorCode.FORBIDDEN
      )
    }
    return true
  }

  if (resourceType === 'shift') {
    const supabase = await createServerSupabaseClient()
    const { data: assignedShift, error } = await supabase
      .from('assigned_shifts')
      .select('id')
      .eq('shift_id', resourceId)
      .eq('employee_id', user.employeeId)
      .single()

    if (error) {
      console.error('[verifyAccess] Error checking shift access:', error)
      throw new AppError(
        'Failed to verify shift access',
        ErrorCode.DATABASE,
        { message: error.message }
      )
    }

    if (!assignedShift) {
      throw new AppError(
        'Access denied: You can only access your assigned shifts',
        ErrorCode.FORBIDDEN
      )
    }
    return true
  }

  throw new AppError(
    'Invalid resource type',
    ErrorCode.INVALID_INPUT
  )
} 