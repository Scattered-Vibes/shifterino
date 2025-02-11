import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
import type { Database } from '@/app/types/supabase/database'

// Create the cached server client
const createClient = cache(() => {
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
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle edge cases where cookies cannot be set
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle edge cases where cookies cannot be removed
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
})

// Export both names for compatibility
export { createClient }
export { createClient as createServerClient }

// Re-export types that might be needed by consumers
export type { Database }