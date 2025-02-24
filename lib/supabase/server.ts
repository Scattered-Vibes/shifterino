import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase/database'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'
import { authDebug } from '@/lib/utils/auth-debug'

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new AppError('Missing env.NEXT_PUBLIC_SUPABASE_URL', ErrorCode.INTERNAL_ERROR, 500)
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new AppError('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY', ErrorCode.INTERNAL_ERROR, 500)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Cookie options for consistent settings
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7 // 7 days
} as const

export type SupabaseServer = ReturnType<typeof createSupabaseServerClient<Database>>

// Create a server client - this should be created per request
export function getServerClient() {
  const cookieStore = cookies()

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...COOKIE_OPTIONS, ...options })
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: '', ...COOKIE_OPTIONS, ...options, maxAge: 0 })
      },
    },
  })
}

// For backwards compatibility
export const createServerClient = getServerClient

// Create an admin client for privileged operations
let adminClient: ReturnType<typeof createSupabaseServerClient<Database>> | null = null

export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new AppError(
      'Missing env.SUPABASE_SERVICE_ROLE_KEY',
      ErrorCode.INTERNAL_ERROR,
      500
    )
  }

  if (!adminClient) {
    const cookieStore = cookies()
    
    adminClient = createSupabaseServerClient<Database>(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // Admin client doesn't need to set cookies
          },
          remove(name: string, options: any) {
            // Admin client doesn't need to remove cookies
          },
        },
      }
    )
  }

  return adminClient
}

// Helper to get authenticated user server-side
export async function getUser() {
  const supabase = getServerClient()
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

/**
 * Manual session refresh function.
 * Only refreshes if the session is close to expiring.
 */
export async function getSession() {
  const supabase = getServerClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Failed to get session:', error)
    return null
  }
  
  return session
}

// Re-export types that might be needed by consumers
export type { Database }