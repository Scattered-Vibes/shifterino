import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase/database'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')

  const cookieStore = cookies()
  const response = NextResponse.redirect(
    `${requestUrl.origin}${next || '/overview'}`
  )

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: { path: string; maxAge?: number; domain?: string; sameSite?: 'lax' | 'strict' | 'none'; secure?: boolean }) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: { path: string; domain?: string }) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: -1,
          })
        },
      },
    }
  )

  try {
    // If we have a code, exchange it for a session
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('[auth/callback] Error exchanging code for session:', error.message)
        return NextResponse.redirect(`${requestUrl.origin}/auth-error`)
      }
    }

    // Verify the session is valid
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('[auth/callback] No valid session found:', sessionError?.message)
      return NextResponse.redirect(`${requestUrl.origin}/auth-error`)
    }

    // Set cache-control headers to prevent caching
    response.headers.set(
      'Cache-Control',
      'no-cache, no-store, max-age=0, must-revalidate'
    )

    return response
  } catch (error) {
    console.error('[auth/callback] Unexpected error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth-error`)
  }
}
