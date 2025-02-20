import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleError, AppError, ErrorCode } from '@/lib/utils/error-handler'
import { headers } from 'next/headers'

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
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[auth:${requestId}] Processing auth callback`)
  
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL
    const headersList = headers()

    // Log request details
    console.log(`[auth:${requestId}] Request details:`, {
      origin: requestUrl.origin,
      referer: headersList.get('referer'),
      userAgent: headersList.get('user-agent')
    })

    // Verify environment configuration
    if (!expectedOrigin) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable is not set')
    }

    // Verify request origin with strict comparison
    if (requestUrl.origin.toLowerCase() !== expectedOrigin.toLowerCase()) {
      console.error(`[auth:${requestId}] Invalid origin:`, {
        expected: expectedOrigin,
        received: requestUrl.origin
      })
      throw new Error('Invalid request origin')
    }

    // Verify authorization code
    if (!code) {
      throw new Error('No authorization code provided in callback')
    }

    console.log(`[auth:${requestId}] Exchanging code for session`)
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error(`[auth:${requestId}] Session exchange failed:`, error)
      throw error
    }

    console.log(`[auth:${requestId}] Session exchange successful:`, {
      userId: data.user?.id,
      email: data.user?.email,
      provider: data.user?.app_metadata?.provider
    })

    // Log successful authentication
    if (data.user) {
      const { error: logError } = await supabase
        .from('auth_logs')
        .insert({
          auth_id: data.user.id,
          email: data.user.email || '',
          success: true,
          ip_address: headersList.get('x-forwarded-for') || requestUrl.hostname,
          user_agent: headersList.get('user-agent'),
          details: { 
            provider: data.user.app_metadata.provider,
            origin: requestUrl.origin,
            request_id: requestId
          }
        })
      
      if (logError) {
        // Log but don't throw - this shouldn't block the auth flow
        console.error(`[auth:${requestId}] Failed to log authentication:`, logError)
      }
    }

    const response = NextResponse.redirect(`${requestUrl.origin}/overview`)
    
    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    return response
  } catch (error) {
    console.error(`[auth:${requestId}] Auth callback error:`, error)
    
    try {
      const message = error instanceof Error ? error.message : 'Unexpected error in auth callback'
      throw new AppError(
        message,
        ErrorCode.UNAUTHORIZED,
        { cause: error }
      )
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
        
        // Include more error details in redirect
        const searchParams = new URLSearchParams({
          error: errorCode,
          message: appError.message,
          request_id: requestId
        })
        
        const response = NextResponse.redirect(
          `${redirectTo}/login?${searchParams.toString()}`
        )
        
        // Add security headers
        response.headers.set('X-Frame-Options', 'DENY')
        response.headers.set('X-Content-Type-Options', 'nosniff')
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
        
        return response
      }
      
      const searchParams = new URLSearchParams({
        error: 'server_error',
        request_id: requestId
      })
      
      const response = NextResponse.redirect(
        `${new URL(request.url).origin}/login?${searchParams.toString()}`
      )
      
      // Add security headers
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      
      return response
    }
  }
}

// Only allow GET and OPTIONS
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { 
      status: 405,
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { 
      status: 405,
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { 
      status: 405,
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    }
  )
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    },
  })
}
