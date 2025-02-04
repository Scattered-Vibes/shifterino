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
import { Database } from '@/types/database'

let supabaseInstance: ReturnType<typeof createServerClient<Database>> | null = null

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
  if (supabaseInstance) {
    return supabaseInstance
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  supabaseInstance = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        /**
         * Get a cookie value by name
         */
        get(name: string) {
          try {
            return cookies().get(name)?.value
          } catch (error) {
            console.error(`Error getting cookie ${name}:`, error)
            return undefined
          }
        },
        /**
         * Set a cookie with the specified name, value, and options
         */
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookies().set({
              name,
              value,
              ...options,
              // Ensure secure cookie settings
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            })
          } catch (error) {
            console.error(`Error setting cookie ${name}:`, error)
          }
        },
        /**
         * Remove a cookie by name
         */
        remove(name: string, options: CookieOptions) {
          try {
            cookies().delete({
              name,
              ...options,
              path: '/',
            })
          } catch (error) {
            console.error(`Error removing cookie ${name}:`, error)
          }
        },
      },
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        debug: process.env.NODE_ENV === 'development',
      },
      global: {
        headers: {
          'X-Client-Info': 'supabase-ssr/0.0.0',
        },
      },
    }
  )

  return supabaseInstance
} 