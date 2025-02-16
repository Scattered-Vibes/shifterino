import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase/database'

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Cookie name should be consistent with what Supabase expects
const COOKIE_NAME = 'sb-localhost-auth-token'

const cookieOptions: CookieOptions = {
  name: COOKIE_NAME,
  httpOnly: true,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 1 week
  domain: 'localhost' // Explicitly set domain for localhost
}

/**
 * Creates a Supabase client for server-side operations with cookie-based session handling.
 * This client should be used for server components and server actions.
 */
export async function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

/**
 * Creates a Supabase client with service role privileges.
 * This should ONLY be used for administrative tasks like database setup.
 * NEVER expose this client to the client side.
 */
export async function createServiceSupabaseClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required environment variable SUPABASE_SERVICE_ROLE_KEY')
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      cookies: {
        get(name: string) {
          return null // Service client doesn't need cookie access
        }
      }
    }
  )
}

// Re-export types that might be needed by consumers
export type { Database }

/**
 * Helper to get authenticated user server-side.
 * Returns null if user is not authenticated or if there's an error.
 */
export async function getUser() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Auth error:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

/**
 * Main client creation function with validation.
 * This should be your primary method for getting a Supabase client in server components.
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
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie errors in development
            console.error('Cookie set error:', error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie errors in development
            console.error('Cookie remove error:', error)
          }
        },
      },
    }
  )
}