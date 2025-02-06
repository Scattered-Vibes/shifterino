import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = cookies()
  const supabase = createClient()

  try {
    // Sign out on server
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    // Clear auth cookies in route handler context
    const authCookies = cookieStore.getAll()
      .filter(cookie => cookie.name.includes('supabase') || cookie.name.includes('sb-'))
    
    authCookies.forEach(cookie => {
      cookieStore.delete(cookie.name)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error signing out:', error)
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 