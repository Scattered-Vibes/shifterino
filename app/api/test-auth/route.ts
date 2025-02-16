import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      throw error
    }

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    return NextResponse.json({ 
      message: 'Authenticated',
      user: session.user 
    })
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 