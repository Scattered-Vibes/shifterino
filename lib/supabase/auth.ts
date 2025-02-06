import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { signOut as signOutAction } from '@/app/(auth)/signout/actions'
import type { 
  AuthResponse, 
  SignInWithPasswordCredentials, 
  SignUpWithPasswordCredentials
} from '@supabase/supabase-js'

/**
 * Helper function to clear auth cookies
 */
function clearAuthCookies(cookieStore: ReturnType<typeof cookies>) {
  const authCookies = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    '__session',
    'sb-provider-token',
    'sb-auth-token'
  ]

  authCookies.forEach(name => {
    try {
      cookieStore.delete(name)
      cookieStore.delete({
        name,
        path: '/'
      })
      if (process.env.NEXT_PUBLIC_DOMAIN) {
        cookieStore.delete({
          name,
          path: '/',
          domain: process.env.NEXT_PUBLIC_DOMAIN
        })
      }
    } catch (e) {
      console.error(`Failed to delete cookie ${name}:`, e)
    }
  })
}

export async function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            const cookie = cookieStore.get(name)
            console.log(`Auth: Getting cookie ${name}:`, cookie?.value ? 'exists' : 'not found')
            return cookie?.value
          } catch (error) {
            console.error(`Auth: Error getting cookie ${name}:`, error)
            return undefined
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            console.log(`Auth: Setting cookie ${name}`)
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.error(`Auth: Error setting cookie ${name}:`, error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            console.log(`Auth: Removing cookie ${name}`)
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.error(`Auth: Error removing cookie ${name}:`, error)
          }
        },
      },
    }
  )
}

export async function getSession() {
  const cookieStore = cookies()
  
  try {
    console.log('Auth: Creating server client for session check')
    const supabase = await createServerSupabaseClient()
    
    console.log('Auth: Fetching session')
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('Auth: Session error:', error)
      throw error
    }

    if (!session?.user?.id) {
      console.log('Auth: No valid session found')
      clearAuthCookies(cookieStore)
      return null
    }

    // Validate session expiry
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at && session.expires_at < now) {
      console.log('Auth: Session expired')
      await signOutAction()
      return null
    }

    // Verify user exists in database
    const { data: user, error: userError } = await supabase
      .from('employees')
      .select('id')
      .eq('auth_id', session.user.id)
      .single()

    if (userError || !user) {
      console.log('Auth: User not found in database, clearing session')
      await signOutAction()
      return null
    }

    console.log('Auth: Valid session found for user:', session.user.id)
    return session
  } catch (error) {
    console.error('Auth: Critical error getting session:', error)
    clearAuthCookies(cookieStore)
    return null
  }
}

export async function signInWithPassword(
  email: string,
  password: string,
  options?: SignInWithPasswordCredentials['options']
): Promise<AuthResponse> {
  const supabase = createClient()
  
  return supabase.auth.signInWithPassword({
    email,
    password,
    ...(options && { options })
  })
}

export async function signUp(
  email: string,
  password: string,
  options?: SignUpWithPasswordCredentials['options']
): Promise<AuthResponse> {
  const supabase = createClient()
  
  return supabase.auth.signUp({
    email,
    password,
    ...(options && { options })
  })
}

export { signOutAction as signOut } 