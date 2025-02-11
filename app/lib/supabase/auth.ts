import type { 
  AuthResponse, 
  SignInWithPasswordCredentials, 
  SignUpWithPasswordCredentials
} from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type UserRole = 'dispatcher' | 'supervisor' | 'manager'

export interface AuthenticatedUser {
  userId: string
  employeeId: string
  role: UserRole
  email: string
  isNewUser: boolean
}

/**
 * Helper function to clear auth cookies
 */
function clearAuthCookies(cookieStore: ReturnType<typeof cookies>) {
  const authCookies = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    '__session',
    'sb-provider-token',
    'sb-auth-token'
  ]

  authCookies.forEach(name => {
    try {
      cookieStore.delete(name)
      cookieStore.delete({
        name,
        path: '/'
      })
      if (process.env.NEXT_PUBLIC_DOMAIN) {
        cookieStore.delete({
          name,
          path: '/',
          domain: process.env.NEXT_PUBLIC_DOMAIN
        })
      }
    } catch (e) {
      console.error(`Failed to delete cookie ${name}:`, e)
    }
  })
}

/**
 * Gets the current user if authenticated
 * Returns null if no user exists or if user is invalid
 */
export async function getUser() {
  const supabase = createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.error('User error:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

/**
 * Verifies employee data exists and matches user role
 * Throws error if verification fails
 */
export async function verifyEmployee(userId: string) {
  const supabase = createClient()
  
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, role, first_name, last_name')
    .eq('auth_id', userId)
    .single()

  if (employeeError || !employee) {
    throw new Error('Employee not found')
  }

  const role = employee.role as UserRole
  if (!['dispatcher', 'supervisor', 'manager'].includes(role)) {
    throw new Error('Invalid role')
  }

  return {
    employeeId: employee.id,
    role,
    isNewUser: !employee.first_name || !employee.last_name
  }
}

/**
 * Signs out the current user and clears auth cookies
 */
export async function signOutUser() {
  const cookieStore = cookies()
  const supabase = createClient()

  try {
    await supabase.auth.signOut()
    clearAuthCookies(cookieStore)
    return { success: true }
  } catch (error) {
    console.error('Signout error:', error)
    return { error: 'Failed to sign out' }
  }
}

/**
 * Requires authentication and returns user data
 * Throws if not authenticated or if employee verification fails
 */
export async function requireAuth(allowIncomplete = false): Promise<AuthenticatedUser> {
  const user = await getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  try {
    const { employeeId, role, isNewUser } = await verifyEmployee(user.id)

    if (isNewUser && !allowIncomplete) {
      throw new Error('Profile incomplete')
    }

    return {
      userId: user.id,
      employeeId,
      role,
      email: user.email || '',
      isNewUser
    }
  } catch (error) {
    console.error('Error in requireAuth:', error)
    throw error
  }
}

export async function signInWithPassword(
  email: string,
  password: string,
  options?: SignInWithPasswordCredentials['options']
): Promise<AuthResponse> {
  const supabase = createClient()
  
  return supabase.auth.signInWithPassword({
    email,
    password,
    ...(options && { options })
  })
}

export async function signUp(
  email: string,
  password: string,
  options?: SignUpWithPasswordCredentials['options']
): Promise<AuthResponse> {
  const supabase = createClient()
  
  return supabase.auth.signUp({
    email,
    password,
    ...(options && { options })
  })
}

export { signOutUser as signOut } 