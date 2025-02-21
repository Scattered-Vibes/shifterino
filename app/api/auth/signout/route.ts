import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/index'
import { createApiResponse, handleApiError } from '@/lib/api/utils'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = createServerClient()
    
    // Get current user before signing out
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('Error getting user before signout:', userError)
    }
    
    // Sign out
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) throw signOutError
    
    // Log successful signout if we had a user
    if (user) {
      const { error: logError } = await supabase
        .from('auth_logs')
        .insert({
          operation: 'signout',
          user_id: user.id,
          details: { method: 'manual' }
        })
      
      if (logError) {
        console.error('Error logging signout:', logError)
      }
    }
    
    return createApiResponse({ message: 'Signed out successfully' })
  } catch (error) {
    return handleApiError(error, 'sign out')
  }
}

// Only allow POST and OPTIONS
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL
  
  if (!allowedOrigin) {
    return new NextResponse(null, { status: 500 })
  }
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    },
  })
}
