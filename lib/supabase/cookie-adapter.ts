import { cookies } from 'next/headers'
import { type CookieOptions } from '@supabase/ssr'

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
