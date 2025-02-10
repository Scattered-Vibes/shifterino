import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleError, getHttpStatus } from '@/lib/utils/error-handler'

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30

/**
 * Cleanup expired sessions and invalid refresh tokens
 * This endpoint should be called periodically (e.g., via cron job)
 */
export async function POST(request: Request) {
  try {
    // Verify secret key to ensure only authorized calls
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized')
    }

    const token = authHeader.split(' ')[1]
    if (token !== process.env.CLEANUP_SECRET_KEY) {
      throw new Error('Invalid token')
    }

    const supabase = createClient()

    // Use admin API to list all sessions
    const { data: sessions, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    const now = Math.floor(Date.now() / 1000)
    const expiredUsers = sessions.users.filter((user) => {
      const lastSignIn = new Date(user.last_sign_in_at || 0).getTime() / 1000
      return now - lastSignIn > THIRTY_DAYS_IN_SECONDS
    })

    if (!expiredUsers.length) {
      return NextResponse.json({
        message: 'No expired sessions found',
        cleaned: 0,
      })
    }

    // Sign out expired users and log the operation
    const cleanupPromises = expiredUsers.map(async (user) => {
      try {
        // Sign out the user
        const { error: signOutError } = await supabase.auth.admin.signOut(user.id)
        if (signOutError) throw signOutError

        // Log the cleanup
        const { error: logError } = await supabase.from('auth_logs').insert({
          operation: 'cleanup',
          user_id: user.id,
          details: {
            reason: 'Session expired',
            last_sign_in: user.last_sign_in_at,
          },
        })

        if (logError) {
          console.error('Error logging cleanup:', logError)
        }

        return true
      } catch (error) {
        console.error(`Error cleaning up user ${user.id}:`, error)
        return false
      }
    })

    const results = await Promise.all(cleanupPromises)
    const successCount = results.filter(Boolean).length

    return NextResponse.json({
      message: 'Successfully cleaned up expired sessions',
      cleaned: successCount,
      total: expiredUsers.length,
    })
  } catch (error) {
    const appError = handleError(error)
    return NextResponse.json(
      { error: appError.message },
      { status: getHttpStatus(appError.code) }
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
