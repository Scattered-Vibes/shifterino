import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/utils/error-handler'

/**
 * GET authentication callback handler.
 *
 * This endpoint handles the authentication callback by retrieving an authorization code from the
 * query parameters of the incoming request. If a valid code is found, it exchanges the code for a
 * session using the Supabase client. After processing the session exchange, the handler redirects the user
 * to the dashboard page, preserving the original request's origin.
 *
 * @param {Request} request - The incoming HTTP request object.
 * @returns {Promise<Response>} A NextResponse that redirects to the '/overview' page.
 */
export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (!code) {
      console.error('No authorization code provided in callback')
      return NextResponse.redirect(`${requestUrl.origin}/login?error=missing_code`)
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_error`)
    }

    // Log successful authentication
    if (data.user) {
      const { error: logError } = await supabase
        .from('auth_logs')
        .insert({
          operation: 'oauth_callback_success',
          user_id: data.user.id,
          details: { provider: data.user.app_metadata.provider }
        })
      
      if (logError) {
        console.error('Error logging oauth callback:', logError)
      }
    }

    return NextResponse.redirect(`${requestUrl.origin}/overview`)
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    const requestUrl = new URL(request.url)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=server_error`)
  }
}

// Only allow GET and OPTIONS
export async function POST() {
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
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_DOMAIN || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
