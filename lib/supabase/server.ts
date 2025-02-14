import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase/database'

// Assert environment variables are set
function assertEnvVars() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing required environment variable NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing required environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
}

export async function createServerSupabaseClient() {
  assertEnvVars()
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
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )
}

// For admin operations that require service role
export async function createServiceSupabaseClient() {
  assertEnvVars()
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required environment variable SUPABASE_SERVICE_ROLE_KEY')
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookies().set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookies().delete({ name, ...options })
        },
      },
    }
  )
}

// Re-export types that might be needed by consumers
export type { Database }

// Helper to get authenticated user server-side
export async function getUser() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function createClient() {
  const supabase = await createServerSupabaseClient()
  // Validate the session immediately using getUser
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Auth error:', error)
  }
  return supabase
}