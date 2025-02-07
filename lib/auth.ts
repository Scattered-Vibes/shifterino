export * from './auth/client'
export * from './auth/server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type UserRole = 'dispatcher' | 'supervisor' | 'manager'

/**
 * Verifies that a user is authenticated and exists in both auth.users and employees tables
 * Redirects to login if authentication is invalid
 */
export async function requireAuthOrRedirect(allowIncomplete = false): Promise<AuthenticatedUser> {
  try {
    return await requireAuth(allowIncomplete)
  } catch (error) {
    console.error('Auth error:', error)
    redirect('/login')
  }
}

/**
 * Signs out the current user and clears all auth cookies
 */
export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error("SignOut error:", error)
    throw new Error('SIGNOUT_FAILED')
  }
}

/**
 * Signs in a user with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<{
  data?: { user: { id: string; email: string | null } };
  error?: AuthError;
}> {
  const supabase = createClient()
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: { message: error.message } }
  }

  return { 
    data: {
      user: {
        id: authData.user.id,
        email: authData.user.email || null
      }
    }
  }
}

/**
 * Signs up a new user with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    console.error('Sign up error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Gets the current session if it exists
 */
export async function getSession() {
  const supabase = createClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session error:', error)
      return null
    }

    if (!session?.user) {
      return null
    }

    // Verify session is still valid
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at && session.expires_at < now) {
      await signOut()
      return null
    }

    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

/**
 * Resets password for a user
 */
export async function resetPassword(email: string) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    console.error('Password reset error:', error)
    return { data: null, error: error as Error }
  }
}

async function getUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function verifyEmployee(userId: string): Promise<{
  employeeId: string;
  role: UserRole;
  isNewUser: boolean;
}> {
  const supabase = createClient()
  const { data: employee, error } = await supabase
    .from('employees')
    .select('id, role')
    .eq('auth_id', userId)
    .single()

  if (error || !employee) {
    return {
      employeeId: '',
      role: 'dispatcher' as const,
      isNewUser: true
    }
  }

  return {
    employeeId: employee.id,
    role: employee.role as UserRole,
    isNewUser: false
  }
}

export async function requireAuth(allowIncomplete = false): Promise<AuthenticatedUser> {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const { employeeId, role, isNewUser } = await verifyEmployee(user.id)

  if (isNewUser && !allowIncomplete) {
    redirect('/complete-profile')
  }

  return {
    userId: user.id,
    employeeId,
    role,
    email: user.email || '',
    isNewUser
  }
} 