import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Custom React hook to initialize and provide a Supabase client instance.
 *
 * This hook creates a Supabase client using the `createClient` function from the Supabase client module.
 * It initializes the client only once when the component mounts and stores it in a state variable.
 *
 * @returns {SupabaseClient | null} The initialized Supabase client instance, or null if it has not been created yet.
 */
export function useSupabase(): SupabaseClient | null {
  const [client, setClient] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    const supabase = createClient()
    setClient(supabase)
  }, [])

  return client
}