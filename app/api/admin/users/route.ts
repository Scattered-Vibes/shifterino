import { getServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'
import { requireManager } from '@/lib/auth/server'

export async function GET() {
  try {
    // Verify manager role using middleware
    const manager = await requireManager()
    if (!manager) {
      throw new AppError('Unauthorized access', ErrorCode.UNAUTHORIZED, 401)
    }
    
    const supabase = getServerClient()
    
    // List users with service role
    const { data, error } = await supabase.auth.admin.listUsers()
    if (error) {
      throw new AppError(error.message, ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
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

export async function DELETE(request: Request) {
  try {
    // Verify manager role using middleware
    const manager = await requireManager()
    if (!manager) {
      throw new AppError('Unauthorized access', ErrorCode.UNAUTHORIZED, 401)
    }
    
    const supabase = getServerClient()
    
    // Get request body
    const body = await request.json()
    if (!body.userIds || !Array.isArray(body.userIds)) {
      throw new AppError('Invalid request body', ErrorCode.VALIDATION_ERROR, 400)
    }
    
    // Delete users
    const errors = []
    for (const userId of body.userIds) {
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) {
        errors.push({ userId, error: error.message })
      }
    }
    
    if (errors.length > 0) {
      throw new AppError('Failed to delete some users', ErrorCode.INTERNAL_SERVER_ERROR, 500, { errors })
    }
    
    return NextResponse.json({ success: true })
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