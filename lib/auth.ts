import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'
import type { User } from '@supabase/supabase-js'
import { cache } from 'react'
import type { EmployeeWithAuth } from '@/types/supabase/index'

/**
 * Get the current authenticated user's session
 * This is cached for the request lifetime
 */
export const getSession = cache(async () => {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('[getSession] Error:', error)
      return null
    }

    return session
  } catch (error) {
    console.error('[getSession] Error:', error)
    return null
  }
})

/**
 * Get the current authenticated user
 * Returns null if no user is authenticated
 */
export async function getUser(): Promise<User | null> {
  const session = await getSession()
  return session?.user ?? null
}

/**
 * Get the current authenticated user with employee data
 * Throws an error if no user is authenticated
 */
export async function requireAuth(): Promise<EmployeeWithAuth> {
  const session = await getSession()
  
  if (!session?.user) {
    throw new AppError(
      'Authentication required',
      ErrorCode.UNAUTHORIZED,
      { message: 'You must be logged in to access this resource' }
    )
  }

  const supabase = await createServerSupabaseClient()
  
  // Get the employee record
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select()
    .eq('auth_id', session.user.id)
    .single()

  if (employeeError || !employee) {
    throw new AppError(
      'Employee not found',
      ErrorCode.NOT_FOUND,
      { message: 'Employee record not found for authenticated user' }
    )
  }

  // Return combined data
  return {
    ...employee,
    auth_user: {
      email: session.user.email ?? '',
      role: session.user.user_metadata.role
    }
  }
}

/**
 * Check if the current user has the required role
 */
export async function checkRole(requiredRole: string): Promise<boolean> {
  const auth = await requireAuth()
  return auth.auth_user?.role === requiredRole
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return !!session?.user
}

/**
 * Get the current user's role
 * Returns null if no user is authenticated
 */
export async function getUserRole(): Promise<string | null> {
  const auth = await requireAuth().catch(() => null)
  return auth?.auth_user?.role ?? null
}

/**
 * Check if the current user's profile is complete
 */
export async function isProfileComplete(): Promise<boolean> {
  const user = await getUser()
  if (!user) return false
  
  return !user.user_metadata.profile_incomplete
}

/**
 * Get the current user's profile data
 */
export async function getUserProfile(): Promise<EmployeeWithAuth> {
  return requireAuth()
}

/**
 * Validate the current session
 * Returns true if the session is valid, false otherwise
 */
export async function validateSession(): Promise<boolean> {
  const session = await getSession()
  if (!session) return false
  
  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.getUser()
    
    return !error
  } catch {
    return false
  }
} 