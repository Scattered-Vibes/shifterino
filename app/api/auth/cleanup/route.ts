import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const cookieStore = cookies()
    
    // Create a response early to handle cookies
    const response = new NextResponse(
      JSON.stringify({ message: 'Session cleaned up successfully' }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_DOMAIN || '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        } 
      }
    )

    // Create Supabase client with SSR
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            })
          },
          remove(name: string) {
            response.cookies.delete({
              name,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            })
          }
        }
      }
    )

    // Check if there's an authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error checking user:', userError)
    }

    // Clear all auth-related cookies
    const authCookies = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      '__session',
      'sb-provider-token',
      'sb-auth-token',
      'sb-auth-token-code-verifier',
      'sb-provider-token',
      'sb-refresh-token-code-verifier'
    ]
    
    authCookies.forEach(name => {
      response.cookies.delete({
        name,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    })

    // Force signout if there's an authenticated user
    if (user) {
      await supabase.auth.signOut({ scope: 'global' })
      
      // Verify user is signed out
      const { data: { user: currentUser }, error: verifyError } = await supabase.auth.getUser()
      if (verifyError) {
        console.error('Error verifying signout:', verifyError)
      }
      if (currentUser) {
        console.error('User still authenticated after cleanup attempt')
        throw new Error('Failed to sign out user')
      }
    }

    return response
  } catch (error) {
    console.error('Cleanup error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to clean up session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_DOMAIN || '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_DOMAIN || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
} 