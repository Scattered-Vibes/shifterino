import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/index'
import { createApiResponse, handleApiError } from '@/lib/api/utils'

export const dynamic = 'force-dynamic'

const COOKIE_OPTIONS = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient()

    // Note: We use getSession here (instead of getUser) because we specifically need
    // the session tokens for refreshing. This is one of the few legitimate uses of getSession.
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('Session refresh error:', error)
      throw error
    }

    if (!session) {
      throw new Error('No active session')
    }

    // Get new session with refreshed tokens
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession()

    if (refreshError) {
      console.error('Token refresh error:', refreshError)
      throw refreshError
    }

    const { session: newSession } = refreshData

    if (!newSession) {
      throw new Error('Failed to create new session')
    }

    // Update session cookies with consistent settings
    cookieStore.set('sb-access-token', newSession.access_token, COOKIE_OPTIONS)
    cookieStore.set('sb-refresh-token', newSession.refresh_token, COOKIE_OPTIONS)

    // Log successful refresh
    try {
      await supabase
        .from('auth_logs')
        .insert({
          operation: 'session_refresh',
          user_id: newSession.user.id,
          details: {
            expires_at: newSession.expires_at,
          },
        })
    } catch (logError) {
      // Don't fail the refresh if logging fails
      console.error('Error logging session refresh:', logError)
    }

    return createApiResponse({
      user: newSession.user,
      expires_at: newSession.expires_at,
    })
  } catch (error) {
    return handleApiError(error, 'refresh session', 401)
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
