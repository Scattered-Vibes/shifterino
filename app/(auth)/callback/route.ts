import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/supabase/database'
import { cookies } from 'next/headers'
import { authDebug } from '@/lib/utils/auth-debug'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7 // 7 days
}

export async function GET(request: Request) {
  const requestId = Math.random().toString(36).substring(7)
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')

  authDebug.debug('Processing callback request', {
    requestId,
    hasCode: !!code,
    next
  })

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
          const value = cookieStore.get(name)?.value
          authDebug.trackCookie('get', name, value)
          return value
        },
        set(name: string, value: string, options: CookieOptions) {
          const cookieOptions = {
            ...COOKIE_OPTIONS,
            ...options,
          }
          authDebug.trackCookie('set', name, value, cookieOptions)
          response.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
        },
        remove(name: string, options: CookieOptions) {
          const cookieOptions = {
            ...COOKIE_OPTIONS,
            ...options,
            maxAge: 0,
          }
          authDebug.trackCookie('remove', name, undefined, cookieOptions)
          response.cookies.set({
            name,
            value: '',
            ...cookieOptions,
          })
        },
      },
    }
  )

  try {
    // If we have a code, exchange it for a session
    if (!code) {
      throw new AppError('No authorization code provided', ErrorCode.VALIDATION_ERROR)
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      authDebug.error('Error exchanging code for session', error, {
        requestId,
        code: code.substring(0, 8) + '...'
      })
      throw new AppError('Failed to exchange code for session', ErrorCode.UNAUTHORIZED)
    }

    // Verify the session is valid
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      authDebug.error('No valid session found', sessionError || new Error('No session'), {
        requestId
      })
      throw new AppError('Session verification failed', ErrorCode.UNAUTHORIZED)
    }

    authDebug.info('Authentication successful', {
      requestId,
      userId: session.user.id,
      email: session.user.email
    })

    // Set cache-control headers to prevent caching
    response.headers.set(
      'Cache-Control',
      'no-cache, no-store, max-age=0, must-revalidate'
    )

    return response
  } catch (error) {
    authDebug.error('Auth callback error', error as Error, {
      requestId,
      code: code?.substring(0, 8) + '...'
    })

    const errorUrl = new URL('/login', requestUrl.origin)
    errorUrl.searchParams.set('error', error instanceof AppError ? error.message : 'Authentication failed')
    errorUrl.searchParams.set('request_id', requestId)

    return NextResponse.redirect(errorUrl)
  }
}
