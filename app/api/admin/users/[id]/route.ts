import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { handleError, AppError } from '@/lib/utils/error-handler'
import { requireManager } from '@/lib/auth/middleware'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify manager role using middleware
    const manager = await requireManager()
    if (!manager) {
      throw new Error('Unauthorized access')
    }
    
    // Validate user ID
    if (!params.id || typeof params.id !== 'string') {
      throw new Error('Invalid user ID')
    }
    
    const supabase = createClient()
    
    // Get user by ID
    const { data, error } = await supabase.auth.admin.getUserById(params.id)
    if (error) {
      throw new Error(error.message)
    }
    
    if (!data.user) {
      throw new Error('User not found')
    }
    
    return NextResponse.json({ data: data.user })
  } catch (error) {
    try {
      const message = error instanceof Error ? error.message : 'Failed to get user'
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify manager role using middleware
    const manager = await requireManager()
    if (!manager) {
      throw new Error('Unauthorized access')
    }
    
    // Validate user ID
    if (!params.id || typeof params.id !== 'string') {
      throw new Error('Invalid user ID')
    }
    
    const supabase = createClient()
    
    // Get current user to prevent self-deletion
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Authentication failed')
    }
    
    // Prevent managers from deleting themselves
    if (params.id === user.id) {
      throw new Error('Cannot delete your own account')
    }
    
    // Delete user
    const { error } = await supabase.auth.admin.deleteUser(params.id)
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