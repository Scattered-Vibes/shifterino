'use server'

import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Comprehensive list of all possible auth-related cookies
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
      // Clear with root path
      cookieStore.delete({
        name,
        path: '/',
      })

      // Clear with specific domain if set
      if (process.env.NEXT_PUBLIC_DOMAIN) {
        cookieStore.delete({
          name,
          path: '/',
          domain: process.env.NEXT_PUBLIC_DOMAIN
        })
      }

      // Clear without specific path/domain
      cookieStore.delete(name)
    } catch (e) {
      console.warn(`Failed to delete cookie ${name}:`, e)
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
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    // Verify user is authenticated before signing out
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error verifying user before signout:', userError)
    }

    if (user) {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        console.error('Error signing out:', signOutError)
      }
    }

    // Clear cookies regardless of user state
    clearAuthCookies(cookieStore)
    
    // Revalidate all pages
    revalidatePath('/', 'layout')
  } catch (error) {
    console.error('Error in signOut:', error)
  }

  // Always redirect to login
  redirect('/login')
}