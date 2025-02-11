'use client'

import { createBrowserClient } from '@supabase/ssr'
import { type Database } from '@/types/supabase/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type SupabaseClient = ReturnType<typeof createClient>

// Create a singleton instance
export const supabase = createClient()

// Helper types
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']
export type TablesInsert<T extends keyof Tables> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Tables> = Database['public']['Tables'][T]['Update']
export type TablesRow<T extends keyof Tables> = Database['public']['Tables'][T]['Row']