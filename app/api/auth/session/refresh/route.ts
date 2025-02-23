'use server'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createApiResponse, handleApiError } from '@/lib/api/utils'
import { authDebug } from '@/lib/utils/auth-debug'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'

export const dynamic = 'force-dynamic'

const COOKIE_OPTIONS: CookieOptions = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

export async function GET() {
  const requestId = Math.random().toString(36).substring(7)
  
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
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
            cookieStore.set({
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
            cookieStore.set({
              name,
              value: '',
              ...cookieOptions,
            })
          },
        },
      }
    )

    authDebug.debug('Refreshing session', { requestId })

    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      authDebug.error('Session refresh error', error, { requestId })
      throw new AppError('Failed to get current session', ErrorCode.UNAUTHORIZED, 401)
    }

    if (!session) {
      throw new AppError('No active session', ErrorCode.UNAUTHORIZED, 401)
    }

    // Get new session with refreshed tokens
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

    if (refreshError) {
      authDebug.error('Token refresh error', refreshError, { requestId })
      throw new AppError('Failed to refresh session', ErrorCode.UNAUTHORIZED, 401)
    }

    const { session: newSession } = refreshData

    if (!newSession) {
      throw new AppError('Failed to create new session', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }

    authDebug.info('Session refreshed successfully', {
      requestId,
      userId: newSession.user.id,
      expiresAt: new Date(newSession.expires_at! * 1000).toISOString()
    })

    // Log successful refresh
    try {
      await supabase
        .from('auth_logs')
        .insert({
          operation: 'session_refresh',
          user_id: newSession.user.id,
          details: {
            request_id: requestId,
            expires_at: newSession.expires_at,
          },
        })
    } catch (logError) {
      // Don't fail the refresh if logging fails
      authDebug.warn('Failed to log session refresh', {
        error: logError instanceof Error ? logError.message : String(logError),
        requestId
      })
    }

    return createApiResponse({
      user: newSession.user,
      expires_at: newSession.expires_at,
    })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    authDebug.error('Unexpected error during session refresh', error as Error, { requestId })
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL
  
  if (!allowedOrigin) {
    return new NextResponse(null, { status: 500 })
  }
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    },
  })
}

// Only allow GET requests
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
