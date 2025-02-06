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
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: { expires?: Date }) => {
          try {
            cookieStore.set(name, value, {
              ...options,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              path: '/',
              httpOnly: true,
            })
          } catch (error) {
            // Handle cookie errors silently in production
            if (process.env.NODE_ENV !== 'production') {
              console.error('Error setting cookie:', error)
            }
          }
        },
        remove: (name: string, options: { path?: string }) => {
          try {
            cookieStore.set(name, '', {
              ...options,
              maxAge: -1,
              path: '/',
            })
          } catch (error) {
            // Handle cookie errors silently in production
            if (process.env.NODE_ENV !== 'production') {
              console.error('Error removing cookie:', error)
            }
          }
        },
      },
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce',
      },
    }
  )
}

// Create a singleton instance for reuse
const supabase = createClient()
export default supabase

// Helper function to get the current session with proper error handling
export async function getCurrentSession() {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      return { session: null, error }
    }
    
    if (!session) {
      return { 
        session: null, 
        error: new Error('No active session found') 
      }
    }
    
    return { session, error: null }
  } catch (error) {
    console.error('Unexpected error getting session:', error)
    return { 
      session: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    }
  }
}

// Helper to get authenticated user or throw
export async function getAuthenticatedUser() {
  const { session, error } = await getCurrentSession()
  
  if (error || !session?.user) {
    throw new Error('Not authenticated')
  }
  
  return session.user
} 