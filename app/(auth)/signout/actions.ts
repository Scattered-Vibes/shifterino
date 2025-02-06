'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const AUTH_COOKIE_NAMES = [
  'sb-access-token',
  'sb-refresh-token',
  'supabase-auth-token',
  '__session',
  'sb-provider-token',
  'sb-auth-token',
  'sb-auth-token-code-verifier',
  'sb-provider-token',
  'sb-refresh-token-code-verifier',
  'sb-auth-token-code-verifier'
]

/**
 * Clears all authentication-related cookies
 */
function clearAuthCookies(cookieStore: ReturnType<typeof cookies>) {
  AUTH_COOKIE_NAMES.forEach(name => {
    try {
      // Clear cookie with root path
      cookieStore.delete({ name, path: '/' })

      // Clear cookie with specific domain if provided
      if (process.env.NEXT_PUBLIC_DOMAIN) {
        cookieStore.delete({ name, path: '/', domain: process.env.NEXT_PUBLIC_DOMAIN })
      }

      // Additional deletion attempt without options
      cookieStore.delete(name)
      console.log(`Cleared cookie: ${name}`)
    } catch (error) {
      console.warn(`Failed to delete cookie ${name}:`, error)
    }
  })
}

/**
 * Signs out the current user and clears all auth cookies
 */
export async function signOut() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieStore }
  )

  try {
    console.log('Clearing authentication cookies')
    clearAuthCookies(cookieStore)

    await supabase.auth.signOut()
    console.log('User signed out successfully')
    return { success: true }
  } catch (error) {
    console.error('Signout error:', error)
    return { error: 'Failed to sign out' }
  }
}