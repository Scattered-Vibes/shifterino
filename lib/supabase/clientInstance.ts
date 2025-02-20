import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase/database'
import { defaultConfig } from './config'

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'

// Create a singleton instance for the browser client
export const browserClient = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  defaultConfig
)

// Re-export types
export type { Database }
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums'] 