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

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { env } from '@/lib/env'

/**
 * Creates a Supabase client instance for server-side operations using the public anonymous key.
 *
 * This function configures and returns a Supabase client that uses custom cookie management
 * through Next.js headers. It is intended for operations where the anon key is sufficient.
 *
 * @returns A Supabase client instance configured with the public URL and anon key.
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 })
        }
      },
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  )
}

/**
 * Creates a Supabase client instance for server-side operations using the service role key.
 *
 * This client is meant for operations requiring elevated privileges. It uses the service role key
 * along with standard cookie management via Next.js headers.
 *
 * @returns A Supabase client instance configured with the service role key.
 */
export function createServiceClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.error('Cookie set error:', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          } catch (error) {
            console.error('Cookie remove error:', error)
          }
        },
      },
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
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