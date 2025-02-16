import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'
import type { User } from '@supabase/supabase-js'
import { cache } from 'react'

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
 * Get the current authenticated user
 * Throws an error if no user is authenticated
 */
export async function requireUser(): Promise<User> {
  const user = await getUser()
  
  if (!user) {
    throw new AppError(
      'Authentication required',
      ErrorCode.UNAUTHORIZED,
      { message: 'You must be logged in to access this resource' }
    )
  }

  return user
}

/**
 * Check if the current user has the required role
 */
export async function checkRole(requiredRole: string): Promise<boolean> {
  const session = await getSession()
  if (!session?.user) return false
  
  return session.user.user_metadata.role === requiredRole
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
  const session = await getSession()
  if (!session?.user) return null
  
  return session.user.user_metadata.role
}

/**
 * Check if the current user's profile is complete
 */
export async function isProfileComplete(): Promise<boolean> {
  const session = await getSession()
  if (!session?.user) return false
  
  return !session.user.user_metadata.profile_incomplete
}

/**
 * Get the current user's profile data
 */
export async function getUserProfile() {
  const user = await requireUser()
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', user.id)
    .single()
    
  if (error) {
    throw new AppError(
      'Failed to fetch user profile',
      ErrorCode.NOT_FOUND,
      { message: error.message }
    )
  }
  
  return data
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