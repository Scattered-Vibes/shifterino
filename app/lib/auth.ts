export * from './auth/client'
export * from './auth/server'

import { createServiceClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'

export type UserRole = 'dispatcher' | 'supervisor' | 'manager'

export interface AuthenticatedUser {
  userId: string
  employeeId: string
  email: string
  role: string
  isNewUser: boolean
}

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
  const supabase = createServiceClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Signs in a user with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<{
  data?: { user: { id: string; email: string | null } };
  error?: AuthError;
}> {
  const supabase = createServiceClient()
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
  const supabase = createServiceClient()
  return await supabase.auth.signUp({
    email,
    password,
  })
}

/**
 * Gets the current session if it exists
 */
export async function getSession() {
  const supabase = createServiceClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Resets password for a user
 */
export async function resetPassword(email: string) {
  const supabase = createServiceClient()
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })
}

export async function requireAuth(allowIncomplete = false): Promise<AuthenticatedUser> {
  const supabase = createServiceClient()
  
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('auth_id', session.user.id)
    .single()

  if (!employee) {
    redirect('/login')
  }

  if (!allowIncomplete && !employee.profile_completed) {
    redirect('/complete-profile')
  }

  return {
    userId: session.user.id,
    employeeId: employee.id,
    email: employee.email,
    role: employee.role,
    isNewUser: !employee.profile_completed,
  }
} 