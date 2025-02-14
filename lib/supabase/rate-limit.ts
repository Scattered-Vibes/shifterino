import { createClient } from '@supabase/supabase-js'
import type { PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type RateLimitEntry = Database['public']['Tables']['rate_limits']['Row']
type RateLimitInsert = Database['public']['Tables']['rate_limits']['Insert']

export async function getRateLimit(key: string): Promise<RateLimitEntry | null> {
  const { data, error } = await supabase
    .from('rate_limits')
    .select()
    .eq('id', key)
    .single()

  if (error) {
    if (isPostgrestError(error) && error.code === 'PGRST116') {
      return null
    }
    throw error
  }

  return data
}

export async function upsertRateLimit(entry: RateLimitInsert): Promise<RateLimitEntry> {
  const { data, error } = await supabase
    .from('rate_limits')
    .upsert(entry)
    .select()
    .single()

  if (error) {
    if (isPostgrestError(error) && error.code === 'PGRST116') {
      return entry as RateLimitEntry
    }
    throw error
  }

  return data
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  )
} 