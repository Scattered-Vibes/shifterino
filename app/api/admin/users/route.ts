import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { handleError, getHttpStatus } from '@/lib/utils/error-handler'
import { requireManager, handleAuthError } from '@/lib/auth/middleware'

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

export async function GET() {
  try {
    // Verify manager role
    await requireManager()
    
    const supabase = createClient()
    
    // List users with service role
    const { data, error } = await supabase.auth.admin.listUsers()
    if (error) throw error
    
    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof Error && ['Unauthorized', 'Manager role required'].includes(error.message)) {
      return handleAuthError(error)
    }
    
    const appError = handleError(error)
    return NextResponse.json(
      { error: appError.message }, 
      { status: getHttpStatus(appError.code) }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    // Verify manager role
    await requireManager()
    
    const supabase = createClient()
    
    // Get user ID to delete from request
    const { userId } = await request.json()
    if (!userId) throw new Error('User ID is required')
    
    // Delete user with service role
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && ['Unauthorized', 'Manager role required'].includes(error.message)) {
      return handleAuthError(error)
    }
    
    const appError = handleError(error)
    return NextResponse.json(
      { error: appError.message }, 
      { status: getHttpStatus(appError.code) }
    )
  }
} 