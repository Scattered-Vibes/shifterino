import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient()

    // Note: We use getSession here (instead of getUser) because we specifically need
    // the session tokens for refreshing. This is one of the few legitimate uses of getSession.
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('Session refresh error:', error)
      return NextResponse.json(
        { error: 'Failed to refresh session' },
        { status: 401 }
      )
    }

    if (!session) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 })
    }

    // Get new session with refreshed tokens
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession()

    if (refreshError) {
      console.error('Token refresh error:', refreshError)
      return NextResponse.json(
        { error: 'Failed to refresh tokens' },
        { status: 401 }
      )
    }

    const { session: newSession } = refreshData

    if (!newSession) {
      return NextResponse.json(
        { error: 'Failed to create new session' },
        { status: 401 }
      )
    }

    // Update session cookie
    cookieStore.set('sb-access-token', newSession.access_token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
    })

    cookieStore.set('sb-refresh-token', newSession.refresh_token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
    })

    return NextResponse.json({
      user: newSession.user,
      expires_at: newSession.expires_at,
    })
  } catch (error) {
    console.error('Unexpected error during session refresh:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
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
