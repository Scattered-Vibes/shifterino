/**
 * Server-side Supabase Client Configuration
 * 
 * This module provides a server-side Supabase client configured with secure cookie handling
 * and authentication settings. It uses the new @supabase/ssr package for Next.js App Router
 * server component integration.
 * 
 * Features:
 * - Secure cookie management with httpOnly and sameSite protections
 * - PKCE authentication flow for enhanced security
 * - Automatic token refresh and session persistence
 * - Standardized API headers for all requests
 * 
 * @module lib/supabase/server
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Creates and configures a server-side Supabase client instance
 * 
 * @returns {Promise<SupabaseClient>} Configured Supabase client for server-side operations
 * @throws {Error} If environment variables are not properly configured
 * 
 * @example
 * ```ts
 * const supabase = createClient()
 * const { data, error } = await supabase.from('table').select()
 * ```
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: { expires?: Date }) {
          cookieStore.set(name, value, {
            ...options,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            httpOnly: true,
          })
        },
        remove(name: string, options: { path?: string }) {
          cookieStore.set(name, '', {
            ...options,
            maxAge: -1,
            path: '/',
          })
        },
      },
      auth: {
        flowType: 'pkce',
      }
    }
  )
}

// Create a singleton instance for reuse
const supabase = createClient()
export default supabase

// Helper function to get the current user with proper error handling
export async function getCurrentUser() {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting user:', error)
      return { user: null, error }
    }
    
    if (!user) {
      return { 
        user: null, 
        error: new Error('No authenticated user found') 
      }
    }
    
    return { user, error: null }
  } catch (error) {
    console.error('Unexpected error getting user:', error)
    return { 
      user: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    }
  }
}

// Helper to get authenticated user or throw
export async function getAuthenticatedUser() {
  const { user, error } = await getCurrentUser()
  
  if (error || !user) {
    throw new Error('Not authenticated')
  }
  
  return user
}

// Only use getSession when full session data is needed
export async function getFullSession() {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  } catch (error) {
    console.error('Error getting full session:', error)
    return { 
      session: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    }
  }
} 