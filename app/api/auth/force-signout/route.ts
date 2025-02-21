import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/index'
import { createApiResponse, handleApiError, requireAuth } from '@/lib/api/utils'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const ForceSignOutSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(1).max(500),
})

/**
 * Force sign out a user (manager only)
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth('manager')
    const supabase = createServerClient()

    // Parse and validate request body
    const body = await request.json()
    const validatedData = ForceSignOutSchema.parse(body)

    // Sign out the target user
    const { error: signOutError } = await supabase.auth.admin.signOut(
      validatedData.userId
    )

    if (signOutError) throw signOutError

    // Log the force sign out
    const { error: logError } = await supabase.from('auth_logs').insert({
      operation: 'force_signout',
      user_id: validatedData.userId,
      details: {
        reason: validatedData.reason,
        admin_id: user.id,
      },
    })

    if (logError) {
      console.error('Error logging force sign out:', logError)
    }

    return createApiResponse({
      message: 'Successfully signed out user',
      userId: validatedData.userId,
    })
  } catch (error) {
    return handleApiError(error, 'force sign out')
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    },
  })
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
