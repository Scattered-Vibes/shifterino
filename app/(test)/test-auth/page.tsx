import { createServiceInstance } from '@/lib/supabase/clientInstance'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Create a service role client
    const supabase = createServiceInstance()

    // Query auth.users using rpc to avoid TypeScript errors
    const { data, error } = await supabase.rpc('get_auth_users')

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      console.error("No data returned")
      return NextResponse.json({ error: 'No data returned' }, { status: 404 })
    }

    // If successful, return the user data
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 