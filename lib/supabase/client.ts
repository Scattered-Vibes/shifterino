/**
 * Client-side Supabase Client Configuration
 * 
 * This module provides a client-side Supabase client configured with secure authentication
 * and standardized request settings. It uses the @supabase/ssr package for Next.js App Router
 * client component integration.
 * 
 * Features:
 * - PKCE authentication flow for enhanced security
 * - Automatic token refresh and session persistence
 * - Session detection in URL for auth callbacks
 * - Standardized API headers for all requests
 * 
 * @module lib/supabase/client
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Helper function to get the authenticated user with proper error handling
 */
export async function getAuthenticatedUser() {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error getting user:', userError)
      return { user: null, error: userError }
    }

    if (!user) {
      return { user: null, error: new Error('No authenticated user found') }
    }

    // Validate user if function exists
    try {
      const { data: isValid, error: validationError } = await supabase.rpc('validate_user', {
        user_id: user.id
      })
      
      if (validationError) {
        console.warn('User validation error:', validationError)
        // Continue with user if validation fails
      } else if (!isValid) {
        return { user: null, error: new Error('Invalid user') }
      }
    } catch (error) {
      // Function might not exist, log error but continue
      console.warn('User validation failed:', error)
    }

    return { user, error: null }
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return { user: null, error: error as Error }
  }
}

/**
 * Helper function to get employee data for authenticated user
 */
export async function getEmployeeData() {
  try {
    const { user, error: userError } = await getAuthenticatedUser()

    if (userError || !user) {
      return { employee: null, error: userError || new Error('No authenticated user') }
    }

    const supabase = createClient()
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (error) {
      console.error('Error getting employee data:', error)
      return { employee: null, error }
    }

    return { employee, error: null }
  } catch (error) {
    console.error('Error getting employee data:', error)
    return { employee: null, error: error as Error }
  }
}

// Create a singleton instance
const supabase = createClient()
export default supabase

// Helper function to get the current session
export async function getCurrentSession() {
  const supabase = createClient()
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { user, error: null }
  } catch (error) {
    console.error('Error getting current session:', error)
    return { user: null, error: error as Error }
  }
}

// Helper function to handle sign in
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    if (!data?.user) {
      throw new Error('No user data returned')
    }

    return { data: { user: data.user }, error: null }
  } catch (error) {
    console.error('Error signing in:', error)
    return { data: null, error: error as Error }
  }
}

// Helper function to handle sign up
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
    console.error('Error signing up:', error)
    return { data: null, error: error as Error }
  }
}

// Helper function to handle password reset
export async function resetPassword(email: string) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error resetting password:', error)
    return { data: null, error: error as Error }
  }
} 