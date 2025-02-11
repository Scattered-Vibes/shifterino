import { createBrowserClient } from '@supabase/ssr'
import { type Database } from '@/types/supabase/database'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const createClient = () => {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public',
    },
  })
}

// Create a singleton instance
export const supabase = createClient()

// Helper types
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']
export type TablesInsert<T extends keyof Tables> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Tables> = Database['public']['Tables'][T]['Update']
export type TablesRow<T extends keyof Tables> = Database['public']['Tables'][T]['Row']