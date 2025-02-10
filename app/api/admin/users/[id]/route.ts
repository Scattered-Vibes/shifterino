import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { handleError, getHttpStatus } from '@/lib/utils/error-handler'

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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')
    
    // Verify manager role
    await verifyManagerRole(user.id)
    
    // Get user by ID
    const { data, error } = await supabase.auth.admin.getUserById(params.id)
    if (error) throw error
    
    if (!data.user) {
      throw new Error('User not found')
    }
    
    return NextResponse.json({ data: data.user })
  } catch (error) {
    const appError = handleError(error)
    return NextResponse.json(
      { error: appError.message }, 
      { status: getHttpStatus(appError.code) }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')
    
    // Verify manager role
    await verifyManagerRole(user.id)
    
    // Delete user
    const { error } = await supabase.auth.admin.deleteUser(params.id)
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    const appError = handleError(error)
    return NextResponse.json(
      { error: appError.message }, 
      { status: getHttpStatus(appError.code) }
    )
  }
} 