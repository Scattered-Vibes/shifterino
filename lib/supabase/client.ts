'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/app/types/supabase/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Re-export types that might be needed by consumers
export type { Database } 