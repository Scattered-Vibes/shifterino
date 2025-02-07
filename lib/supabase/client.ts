/**
 * Client-side Supabase Client Configuration
 * 
 * This module provides a singleton Supabase client for client-side operations.
 * It ensures only one client instance is created and reused across the application.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { handleError } from '@/lib/utils/error-handler'
import config from '@/lib/config.client'

// Single source of truth for client configuration
const clientConfig = {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true
  },
  global: {
    headers: {
      'x-client-info': '@supabase/ssr'
    }
  }
} as const

// Create a singleton instance
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Type-safe helper for auth operations
export const authHelpers = {
  async getUser() {
    try {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) throw error
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      
      if (!session?.access_token) {
        throw new Error('No valid session')
      }

      return { user, error: null }
    } catch (error) {
      return { user: null, error: handleError(error) }
    }
  },

  async getSession() {
    const supabase = createClient()
    return supabase.auth.getSession()
  },

  async signIn(email: string, password: string) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async signUp(email: string, password: string) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async signOut() {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: handleError(error) }
    }
  },

  async resetPassword(email: string) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`
      })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async updatePassword(password: string) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.updateUser({
        password
      })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  }
}

/**
 * Gets the Supabase client instance.
 * Creates a new instance if one doesn't exist, otherwise returns the existing instance.
 */
export function getSupabaseClient() {
  return createClient()
}

/**
 * Hook for client components to access the Supabase client
 */
export function useSupabase() {
  const client = getSupabaseClient()
  return { supabase: client }
}

/**
 * Helper function to get the authenticated user with proper error handling
 */
export async function getAuthenticatedUser() {
  const supabase = getSupabaseClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error getting user:', userError)
      return { user: null, error: userError }
    }

    if (!user) {
      return { user: null, error: new Error('No authenticated user found') }
    }

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.warn('Session error:', sessionError)
      return { user: null, error: sessionError }
    }

    if (!session?.access_token) {
      return { user: null, error: new Error('No valid session') }
    }

    return { user, error: null }
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return { 
      user: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    }
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

    const supabase = getSupabaseClient()
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

// Helper function to get the current session
export async function getUser() {
  const supabase = getSupabaseClient()
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { user, error: null }
  } catch (error) {
    console.error('Error getting current user:', error)
    return { user: null, error: error as Error }
  }
}

// Helper function to handle sign in
export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseClient()
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
  const supabase = getSupabaseClient()
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
  const supabase = getSupabaseClient()
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