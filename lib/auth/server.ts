import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/supabase/database'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'
import type { PostgrestError, User } from '@supabase/supabase-js'
import type { Employee } from '@/types/models/employee'

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

export async function getSessionUser() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    console.log("[getSessionUser] Supabase getUser result:", { 
      user: user ? { 
        id: user.id, 
        email: user.email,
        metadata: user.user_metadata 
      } : null, 
      error 
    })
    if (error) {
      console.error('[getSessionUser] Auth error:', error)
      return null
    }
    if (!user) return null

    return user
  } catch (error) {
    console.error('[getSessionUser] Error getting user:', error)
    return null
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

export async function requireAuth(allowIncomplete = false): Promise<AuthenticatedUser> {
  console.log('[requireAuth] Starting requireAuth, allowIncomplete:', allowIncomplete)
  const user = await getSessionUser()

  if (!user) {
    console.log('[requireAuth] No user, redirecting to login')
    redirect('/login')
  }

  try {
    const supabase = await createServerSupabaseClient()
    console.log('[requireAuth] Fetching employee data for user:', user.id)
    const { data: employee, error } = await supabase
      .from('employees')
      .select('id, role, first_name, last_name')
      .eq('auth_id', user.id)
      .single()

    if (error) {
      console.error('[requireAuth] Error fetching employee data:', error)
      throw new AppError(
        'Failed to fetch employee data.',
        ErrorCode.DATABASE,
        { message: error.message, code: error.code, details: error.details }
      )
    }

    // Handle case where no employee is found
    if (!employee) {
      console.log('[requireAuth] No employee record found, redirecting to complete-profile')
      redirect('/complete-profile')
    }

    const isNewUser = !employee.first_name || !employee.last_name
    console.log('[requireAuth] User profile status:', { isNewUser, employee })

    if (isNewUser && !allowIncomplete) {
      console.log('[requireAuth] Incomplete profile, redirecting')
      redirect('/complete-profile')
    }

    return {
      userId: user.id,
      employeeId: employee.id,
      role: employee.role,
      email: user.email!,
      isNewUser,
      firstName: employee.first_name,
      lastName: employee.last_name
    }
  } catch (error) {
    console.error('[requireAuth] Authentication error:', error)
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
  console.log('[requireRole] Checking role:', { userRole: user.role, allowedRoles: roles })
  if (!roles.includes(user.role)) {
    console.log('[requireRole] Unauthorized role, redirecting')
    redirect('/unauthorized')
  }
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