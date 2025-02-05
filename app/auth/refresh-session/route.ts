import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) throw error

    if (!session) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      )
    }

    return NextResponse.json({ session }, { status: 200 })
  } catch (error) {
    console.error('Session refresh error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to refresh session' },
      { status: 500 }
    )
  }
} 