import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase/database'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new AppError('Missing env.NEXT_PUBLIC_SUPABASE_URL', ErrorCode.INTERNAL_ERROR)
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new AppError('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY', ErrorCode.INTERNAL_ERROR)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Define client type
type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>

// Create singleton instance
let clientInstance: SupabaseClient | null = null

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return clientInstance
}

// Export singleton instance
export const supabase = getSupabaseClient()

// Export type for use in other files
export type { Database }

// Auth helper functions
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Login error:', error)
    throw new AppError(
      'Failed to sign in',
      ErrorCode.UNAUTHORIZED,
      401,
      error
    )
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Signout error:', error)
    throw new AppError(
      'Failed to sign out',
      ErrorCode.INTERNAL_ERROR,
      500,
      error
    )
  }
} 