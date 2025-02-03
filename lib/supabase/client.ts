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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Ensure required environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables')
}

/**
 * Creates and configures a client-side Supabase client instance
 * 
 * @returns {SupabaseClient} Configured Supabase client for client-side operations
 * @throws {Error} If environment variables are not properly configured
 * 
 * @example
 * ```ts
 * const supabase = createClient()
 * const { data, error } = await supabase.from('table').select()
 * ```
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Profile': 'public',
          'Content-Profile': 'public',
          'Prefer': 'return=representation'
        },
      },
    }
  )
}

/**
 * Helper function to get the authenticated user
 * Uses getUser() instead of getSession() for better security
 */
export async function getAuthenticatedUser() {
  const supabase = createClient()
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { user, error: null }
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return { user: null, error }
  }
}

/**
 * Helper function to get employee data for authenticated user
 */
export async function getEmployeeData() {
  const supabase = createClient()
  try {
    const { user, error: userError } = await getAuthenticatedUser()
    if (userError) throw userError
    if (!user) return { employee: null, error: new Error('No authenticated user') }

    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (error) throw error
    return { employee, error: null }
  } catch (error) {
    console.error('Error getting employee data:', error)
    return { employee: null, error }
  }
}

// Create a default client instance
const supabase = createClient()

export default supabase 