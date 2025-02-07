import { NextResponse } from 'next/server'

import { createServiceClient } from '@/lib/supabase/server'

/**
 * Cleanup expired sessions and invalid refresh tokens
 * This endpoint should be called periodically (e.g., via cron job)
 */
export async function POST(request: Request) {
  try {
    // Verify secret key to ensure only authorized calls
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    if (token !== process.env.CLEANUP_SECRET_KEY) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Use admin API to list all sessions
    const { data: sessions, error: listError } =
      await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json(
        { error: 'Failed to list users' },
        { status: 500 }
      )
    }

    const now = Math.floor(Date.now() / 1000)
    const expiredUsers = sessions.users.filter((user) => {
      const lastSignIn = new Date(user.last_sign_in_at || 0).getTime() / 1000
      return now - lastSignIn > 60 * 60 * 24 * 30 // 30 days
    })

    if (!expiredUsers.length) {
      return NextResponse.json({
        message: 'No expired sessions found',
        cleaned: 0,
      })
    }

    // Sign out expired users
    const signOutPromises = expiredUsers.map((user) =>
      supabase.auth.admin.signOut(user.id)
    )

    await Promise.all(signOutPromises).catch((error) => {
      console.error('Error signing out users:', error)
    })

    return NextResponse.json({
      message: 'Successfully cleaned up expired sessions',
      cleaned: expiredUsers.length,
    })
  } catch (error) {
    console.error('Unexpected error during cleanup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
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
