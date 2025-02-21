import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase/database'
import type { CookieOptions } from '@supabase/ssr'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new AppError(
    'Missing env.NEXT_PUBLIC_SUPABASE_URL',
    ErrorCode.INTERNAL_ERROR,
    500
  )
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new AppError(
    'Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ErrorCode.INTERNAL_ERROR,
    500
  )
}

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7 // 7 days
}

/**
 * Creates a Supabase client for server components and Route Handlers.
 * @returns A Supabase client instance.
 * @throws {AppError} If the Supabase URL or anon key are missing.
 */
export function createClient() {
  const cookieStore = cookies()
  const requestId = Math.random().toString(36).substring(7)
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            const cookie = cookieStore.get(name)
            return cookie?.value
          } catch (error) {
            console.error(`[supabase:${requestId}] Error getting cookie:`, {
              name,
              error: error instanceof Error ? error.message : error
            })
            return undefined
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            const mergedOptions = { ...COOKIE_OPTIONS, ...options }
            cookieStore.set({ name, value, ...mergedOptions })
          } catch (error) {
            console.error(`[supabase:${requestId}] Error setting cookie:`, {
              name,
              error: error instanceof Error ? error.message : error
            })
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            const mergedOptions = { ...COOKIE_OPTIONS, ...options }
            cookieStore.set({ name, value: '', ...mergedOptions, maxAge: 0 })
          } catch (error) {
            console.error(`[supabase:${requestId}] Error removing cookie:`, {
              name,
              error: error instanceof Error ? error.message : error
            })
          }
        },
      },
      auth: {
        detectSessionInUrl: true,
        flowType: 'pkce',
        debug: process.env.NODE_ENV === 'development'
      }
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
        status: error.status,
        code: error.name
      })
      return null
    }
    
    if (!user) {
      console.log(`[getUser:${requestId}] No user found`)
      return null
    }

    console.log(`[getUser:${requestId}] User found:`, {
      id: user.id,
      email: user.email,
      lastSignIn: user.last_sign_in_at
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
  
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error(`[refreshSession:${requestId}] Session check error:`, {
        message: error.message,
        status: error.status,
        code: error.name
      })
      throw new AppError('Failed to get session', ErrorCode.UNAUTHORIZED)
    }
    
    if (!session) {
      console.log(`[refreshSession:${requestId}] No session found`)
      return { data: { session: null }, error: null }
    }
    
    if (session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000)
      const now = new Date()
      const timeUntilExpiry = expiresAt.getTime() - now.getTime()
      
      console.log(`[refreshSession:${requestId}] Session status:`, {
        expiresAt: expiresAt.toISOString(),
        timeUntilExpiry: Math.floor(timeUntilExpiry / 1000 / 60) + ' minutes',
        needsRefresh: timeUntilExpiry < 5 * 60 * 1000
      })
      
      // Only refresh if token is close to expiring (within 5 minutes)
      if (timeUntilExpiry < 5 * 60 * 1000) {
        console.log(`[refreshSession:${requestId}] Refreshing session`)
        const refreshResult = await supabase.auth.refreshSession()
        
        if (refreshResult.error) {
          console.error(`[refreshSession:${requestId}] Refresh failed:`, {
            error: refreshResult.error.message,
            code: refreshResult.error.name
          })
        } else {
          console.log(`[refreshSession:${requestId}] Session refreshed successfully`)
        }
        
        return refreshResult
      }
    }
    
    return { data: { session }, error: null }
  } catch (error) {
    console.error(`[refreshSession:${requestId}] Unexpected error:`, 
      error instanceof Error ? error.message : error
    )
    return { 
      data: { session: null }, 
      error: error instanceof AppError ? error : new AppError('Failed to refresh session', ErrorCode.UNAUTHORIZED)
    }
  }
}

// Re-export types that might be needed by consumers
export type { Database }