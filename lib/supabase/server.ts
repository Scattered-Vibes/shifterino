import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase/database'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'
import { CookieOptions } from '@supabase/ssr'

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Cookie configuration
const COOKIE_NAME = 'sb-localhost-auth-token'

/**
 * Creates a Supabase client for server components and Route Handlers.
 * @returns A Supabase client instance.
 * @throws {AppError} If the Supabase URL or anon key are missing.
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
            cookieStore.set({
              name,
              value,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              ...options
            })
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({
              name,
              path: '/',
              ...options
            })
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
}

/**
 * Helper to get authenticated user server-side.
 * Returns null if user is not authenticated or if there's an error.
 */
export async function getUser() {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[getUser:${requestId}] Starting user check`)
  
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error(`[getUser:${requestId}] Auth error:`, {
        message: error.message,
        status: error.status
      })
      return null
    }
    
    if (!user) {
      console.log(`[getUser:${requestId}] No user found`)
      return null
    }

    console.log(`[getUser:${requestId}] User found:`, {
      id: user.id,
      email: user.email
    })
    
    return user
  } catch (error) {
    console.error(`[getUser:${requestId}] Unexpected error:`, 
      error instanceof Error ? error.message : error
    )
    return null
  }
}

/**
 * Manual session refresh function.
 * Only refreshes if the session is close to expiring.
 */
export async function refreshSession() {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[refreshSession:${requestId}] Starting session refresh check`)
  
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error(`[refreshSession:${requestId}] Session check error:`, {
      message: error.message,
      status: error.status
    })
    return { data: { session: null }, error }
  }
  
  if (session?.expires_at) {
    const expiresAt = new Date(session.expires_at * 1000)
    const now = new Date()
    
    // Only refresh if token is close to expiring (within 5 minutes)
    if ((expiresAt.getTime() - now.getTime()) < 5 * 60 * 1000) {
      console.log(`[refreshSession:${requestId}] Session near expiry, refreshing`)
      return await supabase.auth.refreshSession()
    }
    
    console.log(`[refreshSession:${requestId}] Session valid, no refresh needed`)
  }
  
  return { data: { session }, error: null }
}

// Re-export types that might be needed by consumers
export type { Database }