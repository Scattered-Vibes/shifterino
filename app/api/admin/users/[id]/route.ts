import { getServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { handleError, AppError, ErrorCode } from '@/lib/utils/error-handler'
import { requireManager } from '@/lib/auth/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify manager role using middleware
    const manager = await requireManager()
    if (!manager) {
      throw new AppError('Unauthorized access', ErrorCode.UNAUTHORIZED, 401)
    }
    
    // Validate user ID
    if (!params.id || typeof params.id !== 'string') {
      throw new AppError('Invalid user ID', ErrorCode.VALIDATION_ERROR, 400)
    }
    
    const supabase = getServerClient()
    
    // Get user by ID
    const { data, error } = await supabase.auth.admin.getUserById(params.id)
    if (error) {
      throw new AppError(error.message, ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
    
    if (!data.user) {
      throw new AppError('User not found', ErrorCode.NOT_FOUND, 404)
    }
    
    return NextResponse.json({ data: data.user })
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify manager role using middleware
    const manager = await requireManager()
    if (!manager) {
      throw new AppError('Unauthorized access', ErrorCode.UNAUTHORIZED, 401)
    }
    
    // Validate user ID
    if (!params.id || typeof params.id !== 'string') {
      throw new AppError('Invalid user ID', ErrorCode.VALIDATION_ERROR, 400)
    }
    
    const supabase = getServerClient()
    
    // Delete user by ID
    const { error } = await supabase.auth.admin.deleteUser(params.id)
    if (error) {
      throw new AppError(error.message, ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
    
    return NextResponse.json({ success: true })
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