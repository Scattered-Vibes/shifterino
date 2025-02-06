import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Auth error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      )
    }

    // Get employee data for the authenticated user
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (employeeError) {
      console.error('Employee data error:', employeeError)
      return NextResponse.json(
        { error: 'Failed to fetch employee data' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      user,
      employee
    }, { 
      status: 200 
    })
  } catch (error) {
    console.error('Auth refresh error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to refresh authentication' },
      { status: 500 }
    )
  }
} 