import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase/database'
import { defaultConfig } from './config'

// Server client (for server components and API routes)
export function createServerInstance() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...defaultConfig,
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.warn('[Cookie] Set failed:', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: -1 })
          } catch (error) {
            console.warn('[Cookie] Remove failed:', error)
          }
        },
      },
    }
  )
}

// Service client (for admin operations)
export function createServiceInstance() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required environment variable SUPABASE_SERVICE_ROLE_KEY')
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      ...defaultConfig,
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {}
      }
    }
  )
} 