import { cookies } from 'next/headers'
import { type CookieOptions } from '@supabase/ssr'

const AUTH_COOKIE_NAMES = [
  'sb-access-token',
  'sb-refresh-token',
  'supabase-auth-token',
  '__session',
  'sb-provider-token',
  'sb-auth-token',
  'sb-auth-token-code-verifier',
  'sb-provider-token',
  'sb-refresh-token-code-verifier'
]

export function clearAuthCookies(cookieStore: ReturnType<typeof cookies>) {
  AUTH_COOKIE_NAMES.forEach(name => {
    try {
      cookieStore.delete(name)
      cookieStore.delete({ name, path: '/' })
      if (process.env.NEXT_PUBLIC_DOMAIN) {
        cookieStore.delete({ name, path: '/', domain: process.env.NEXT_PUBLIC_DOMAIN })
      }
    } catch (error) {
      console.warn(`Failed to delete cookie ${name}:`, error)
    }
  })
}

export function createServerCookieAdapter() {
  const cookieStore = cookies()
  
  return {
    getAll: () => {
      try {
        return cookieStore.getAll().map(cookie => ({
          name: cookie.name,
          value: cookie.value
        }))
      } catch (error) {
        console.error('Error getting cookies:', error)
        return []
      }
    },
    setAll: (cookieOptions: Record<string, { name: string, value: string, options?: CookieOptions }>) => {
      try {
        Object.values(cookieOptions).forEach(({ name, value, options = {} }) => {
          cookieStore.set(name, value, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            ...options
          })
        })
      } catch (error) {
        console.error('Error setting cookies:', error)
        throw new Error('Failed to set authentication cookies')
      }
    }
  }
}
