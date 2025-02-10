import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { handleError, getHttpStatus } from '@/lib/utils/error-handler'

const ForceSignOutSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(1).max(500),
})

// Verify admin/manager role
async function verifyManagerRole(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('employees')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data || data.role !== 'manager') {
    throw new Error('Unauthorized - Manager role required')
  }
}

/**
 * Force sign out a user (admin only)
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')
    
    // Verify manager role
    await verifyManagerRole(user.id)

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

    return NextResponse.json({
      message: 'Successfully signed out user',
      userId: validatedData.userId,
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
