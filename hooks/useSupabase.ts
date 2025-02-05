import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Custom React hook to initialize and provide a Supabase client instance.
 *
 * This hook creates a Supabase client using the `createClient` function from the Supabase client module.
 * It initializes the client only once when the component mounts and stores it in a state variable.
 *
 * @returns {SupabaseClient<Database>} The initialized Supabase client instance.
 */
export function useSupabase(): SupabaseClient<Database> {
  const supabase = createClient()
  return supabase
}