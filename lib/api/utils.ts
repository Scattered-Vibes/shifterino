import { NextResponse } from 'next/server'
import { handleError } from '@/lib/utils/error-handler'
import { createServerClient } from '@/lib/supabase/index'

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

export async function requireAuth(role?: 'admin' | 'manager' | 'supervisor') {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  if (role) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Profile not found')
    }

    if (profile.role !== role) {
      throw new Error(`Forbidden - ${role} access required`)
    }
  }

  return user
}

export function createApiResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data
  })
}

export function handleApiError(
  error: unknown,
  operation: string,
  status = 500
): NextResponse<ApiResponse<never>> {
  console.error(`API Error (${operation}):`, error)
  const { message } = handleError(error)
  
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status }
  )
} 