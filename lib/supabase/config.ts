import type { SupabaseClientOptions } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'

// Extend the base SupabaseClientOptions with SSR-specific options
type SupabaseConfig = SupabaseClientOptions<'public'> & {
  cookies?: {
    name?: string
    lifetime?: number
    domain?: string
    sameSite?: 'lax' | 'strict' | 'none'
    secure?: boolean
  }
}

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'

export const defaultConfig: SupabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-app-version': APP_VERSION
    }
  },
  cookies: {
    name: 'sb-auth',
    lifetime: 60 * 60 * 24 * 7, // 1 week
    domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
} 