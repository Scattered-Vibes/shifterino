import { createServerClient, CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase/database'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'
import { authDebug } from '@/lib/utils/auth-debug'

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

let client: ReturnType<typeof createServerClient<Database>> | null = null

export function getServerClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value
          authDebug.trackCookie('get', name, value)
          return value
        },
        set(name: string, value: string, options: Partial<CookieOptions>) {
          try {
            const cookieOptions = {
              ...COOKIE_OPTIONS,
              ...options,
            }
            cookieStore.set({
              name,
              value,
              ...cookieOptions,
            })
            authDebug.trackCookie('set', name, value, cookieOptions)
          } catch (error) {
            authDebug.error('Failed to set cookie', error as Error, {
              name,
              valueLength: value.length,
              options
            })
          }
        },
        remove(name: string, options: Partial<CookieOptions>) {
          try {
            const cookieOptions = {
              ...COOKIE_OPTIONS,
              ...options,
              maxAge: 0,
            }
            cookieStore.set({
              name,
              value: '',
              ...cookieOptions,
            })
            authDebug.trackCookie('remove', name, undefined, cookieOptions)
          } catch (error) {
            authDebug.error('Failed to remove cookie', error as Error, {
              name,
              options
            })
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