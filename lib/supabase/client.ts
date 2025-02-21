import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase/database'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Export the singleton instance
export const supabase = createClient()

// Auth helper functions using the singleton client
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