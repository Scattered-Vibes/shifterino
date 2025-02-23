import { NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase/server'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'

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
      throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401)
    }

    const token = authHeader.split(' ')[1]
    if (token !== process.env.CLEANUP_SECRET_KEY) {
      throw new AppError('Invalid token', ErrorCode.UNAUTHORIZED, 401)
    }

    const supabase = getServerClient()

    // Use admin API to list all sessions
    const { data: sessions, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      throw new AppError(listError.message, ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }

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
    const errors = []
    for (const user of expiredUsers) {
      try {
        // Sign out the user
        const { error: signOutError } = await supabase.auth.admin.signOut(user.id)
        if (signOutError) {
          errors.push({ userId: user.id, error: signOutError.message })
          continue
        }

        // Log the cleanup
        const { error: logError } = await supabase
          .from('auth_logs')
          .insert({
            user_id: user.id,
            action: 'cleanup',
            details: {
              reason: 'expired_session',
              last_sign_in: user.last_sign_in_at,
            },
          })

        if (logError) {
          errors.push({ userId: user.id, error: `Logged out but failed to log: ${logError.message}` })
        }
      } catch (error) {
        errors.push({ userId: user.id, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    return NextResponse.json({
      message: 'Cleanup completed',
      cleaned: expiredUsers.length - errors.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.statusCode }
      )
    }

    // Handle unexpected errors
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// Disallow other methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}
