import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = cookies()
    
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.delete(name)
          },
        },
      }
    )

    // Sign out and clear session
    await supabase.auth.signOut()

    // Clear all auth-related cookies
    const authCookies = [
      'sb-127-auth-token',
      'sb-127-auth-token-code-verifier',
      'sb-127-provider-token',
      'sb-127-refresh-token'
    ]

    authCookies.forEach(name => {
      try {
        cookieStore.delete(name)
      } catch (e) {
        console.error(`Failed to delete cookie ${name}:`, e)
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Session cleared successfully' 
    })
  } catch (error) {
    console.error('Error clearing session:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clear session' 
    }, { status: 500 })
  }
} 