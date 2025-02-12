import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleError, AppError } from '@/lib/utils/error-handler'

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
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL

    // Verify environment configuration
    if (!expectedOrigin) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable is not set')
    }

    // Verify request origin with strict comparison
    if (requestUrl.origin.toLowerCase() !== expectedOrigin.toLowerCase()) {
      throw new Error('Invalid request origin')
    }

    // Verify authorization code
    if (!code) {
      throw new Error('No authorization code provided in callback')
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      throw error
    }

    // Log successful authentication
    if (data.user) {
      const { error: logError } = await supabase
        .from('auth_logs')
        .insert({
          operation: 'oauth_callback_success',
          user_id: data.user.id,
          details: { 
            provider: data.user.app_metadata.provider,
            origin: requestUrl.origin
          }
        })
      
      if (logError) {
        // Log but don't throw - this shouldn't block the auth flow
        console.error('Failed to log authentication:', logError)
      }
    }

    return NextResponse.redirect(`${requestUrl.origin}/overview`)
  } catch (error) {
    try {
      const message = error instanceof Error ? error.message : 'Unexpected error in auth callback'
      handleError(message, error)
    } catch (appError) {
      if (appError instanceof AppError) {
        const errorCode = appError.code === 'UNAUTHORIZED' ? 'auth_error' :
                         appError.code === 'VALIDATION' ? 'invalid_request' :
                         appError.code === 'NOT_FOUND' ? 'missing_code' :
                         'server_error'
        
        const requestUrl = new URL(request.url)
        const redirectTo = appError.code === 'FORBIDDEN' ? 
          process.env.NEXT_PUBLIC_APP_URL : 
          requestUrl.origin
        
        return NextResponse.redirect(`${redirectTo}/login?error=${errorCode}`)
      }
      return NextResponse.redirect(`${new URL(request.url).origin}/login?error=server_error`)
    }
  }
}

// Only allow GET and OPTIONS
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || '*'
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
