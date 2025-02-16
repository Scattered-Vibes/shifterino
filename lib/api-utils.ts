import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function requireAuth(request: NextRequest) {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return session
}

export async function requireAdmin(request: NextRequest) {
  const sessionResult = await requireAuth(request)
  
  if (!(sessionResult instanceof NextResponse) && sessionResult.user) {
    const supabase = createClient()
    const { data: employee, error } = await supabase
      .from('employees')
      .select('role')
      .eq('auth_id', sessionResult.user.id)
      .single()

    if (error || !employee || employee.role !== 'manager') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return sessionResult
  }

  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  )
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
} 