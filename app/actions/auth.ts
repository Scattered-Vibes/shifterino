import { createServerClient, CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function forceSignOut() {
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
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )

  try {
    // First revoke all sessions in the database
    await supabase.rpc('revoke_all_sessions')
    
    // Then sign out the current user
    await supabase.auth.signOut({ scope: 'global' })
    
    // Clear all auth cookies
    const cookies = cookieStore.getAll()
    cookies.forEach(cookie => {
      if (
        cookie.name.includes('supabase') || 
        cookie.name.includes('sb-') ||
        cookie.name.includes('auth')
      ) {
        cookieStore.delete({
          name: cookie.name,
          path: '/',
          domain: 'localhost'
        })
      }
    })

    // Clear local storage if we're in the browser
    if (typeof window !== 'undefined') {
      window.localStorage.clear()
    }
  } catch (error) {
    console.error('Force sign out error:', error)
  }

  // Always redirect to login, even if there was an error
  redirect('/login')
} 