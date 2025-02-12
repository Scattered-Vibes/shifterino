import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { handleError, AppError } from '@/lib/utils/error-handler'
import { requireManager } from '@/lib/auth/middleware'

export async function GET() {
  try {
    // Verify manager role using middleware
    const manager = await requireManager()
    if (!manager) {
      throw new Error('Unauthorized access')
    }
    
    const supabase = createClient()
    
    // List users with service role
    const { data, error } = await supabase.auth.admin.listUsers()
    if (error) {
      throw new Error(error.message)
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    try {
      const message = error instanceof Error ? error.message : 'Failed to list users'
      handleError(message, error)
    } catch (appError) {
      if (appError instanceof AppError) {
        return NextResponse.json(
          { error: appError.message },
          { status: appError.code === 'UNAUTHORIZED' ? 401 : 
                   appError.code === 'FORBIDDEN' ? 403 : 
                   appError.code === 'NOT_FOUND' ? 404 : 500 }
        )
      }
      return NextResponse.json(
        { error: 'An unexpected error occurred' },
        { status: 500 }
      )
    }
  }
}

export async function DELETE(request: Request) {
  try {
    // Verify manager role using middleware
    const manager = await requireManager()
    if (!manager) {
      throw new Error('Unauthorized access')
    }
    
    const supabase = createClient()
    
    // Get user ID to delete from request body with validation
    let userId: string
    try {
      const body = await request.json()
      if (!body || typeof body.userId !== 'string' || !body.userId) {
        throw new Error('Invalid request body: userId is required')
      }
      userId = body.userId
    } catch (parseError) {
      throw new Error('Invalid JSON in request body')
    }
    
    // Get current user to prevent self-deletion
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Authentication failed')
    }
    
    // Prevent managers from deleting themselves
    if (userId === user.id) {
      throw new Error('Cannot delete your own account')
    }
    
    // Delete user with service role
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
      throw new Error(error.message)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    try {
      const message = error instanceof Error ? error.message : 'Failed to delete user'
      handleError(message, error)
    } catch (appError) {
      if (appError instanceof AppError) {
        return NextResponse.json(
          { error: appError.message },
          { status: appError.code === 'UNAUTHORIZED' ? 401 : 
                   appError.code === 'FORBIDDEN' ? 403 : 
                   appError.code === 'NOT_FOUND' ? 404 : 
                   appError.code === 'VALIDATION' ? 400 : 500 }
        )
      }
      return NextResponse.json(
        { error: 'An unexpected error occurred' },
        { status: 500 }
      )
    }
  }
} 