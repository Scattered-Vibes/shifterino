import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase/database'

// In development, use local values if environment variables are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Only throw errors in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
  }
}

/**
 * Singleton Supabase admin client with service role privileges.
 * This should ONLY be used for administrative tasks that require elevated privileges.
 */
export const supabaseAdmin = createServerClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    cookies: {
      get(name: string) {
        return null // Service client doesn't need cookie access
      },
      set(name: string, value: string, options: CookieOptions) {
        // No-op - service client doesn't set cookies
      },
      remove(name: string, options: CookieOptions) {
        // No-op - service client doesn't remove cookies
      }
    }
  }
)

// Re-export types that might be needed by consumers
export type { Database } 