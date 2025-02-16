import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase/database'

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create a singleton instance for the browser client
export const browserClient = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Server client (for server components and API routes)
export function createServerInstance() {
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
          // Only set cookies in server actions or API routes
          if (typeof document === 'undefined') {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Expected in middleware or edge functions
              console.warn('[Cookie] Set failed:', error)
            }
          }
        },
        remove(name: string, options: CookieOptions) {
          // Only remove cookies in server actions or API routes
          if (typeof document === 'undefined') {
            try {
              cookieStore.set({ 
                name, 
                value: '', 
                ...options,
                maxAge: 0 
              })
            } catch (error) {
              // Expected in middleware or edge functions
              console.warn('[Cookie] Remove failed:', error)
            }
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
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {}
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  )
}

// Re-export types
export type { Database }
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums'] 