import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createServiceClient } from '@/lib/supabase/server'

const ForceSignOutSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(1).max(500),
})

/**
 * Force sign out a user (admin only)
 */
export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()

    // Verify admin authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin user from token
    const adminToken = authHeader.split(' ')[1]
    const {
      data: { user: adminUser },
      error: adminError,
    } = await supabase.auth.getUser(adminToken)

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: 'Invalid admin token' },
        { status: 401 }
      )
    }

    // Verify admin role
    const { data: adminEmployee, error: roleError } = await supabase
      .from('employees')
      .select('role')
      .eq('auth_id', adminUser.id)
      .single()

    if (roleError || !adminEmployee || adminEmployee.role !== 'manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = ForceSignOutSchema.parse(body)

    // Sign out the target user
    const { error: signOutError } = await supabase.auth.admin.signOut(
      validatedData.userId
    )

    if (signOutError) {
      console.error('Error force signing out user:', signOutError)
      return NextResponse.json(
        { error: 'Failed to sign out user' },
        { status: 500 }
      )
    }

    // Log the force sign out
    const { error: logError } = await supabase.from('auth_logs').insert({
      operation: 'force_signout',
      user_id: validatedData.userId,
      details: {
        reason: validatedData.reason,
        admin_id: adminUser.id,
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
    console.error('Unexpected error during force sign out:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

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
