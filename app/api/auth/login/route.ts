import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations/auth'
import { authRateLimiter, createRateLimitResponse } from '@/lib/middleware/supabase-rate-limit'
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function POST(request: NextRequest) {
  console.log('=== Starting login attempt ===')
  
  try {
    // Log request details
    console.log('Request headers:', {
      contentType: request.headers.get('content-type'),
      cookie: request.headers.get('cookie'),
      userAgent: request.headers.get('user-agent')
    })

    // Check rate limit first
    console.log('Checking rate limit...')
    const rateLimitResult = await authRateLimiter.check(request)
    if (!rateLimitResult.success) {
      console.log('Rate limit exceeded:', rateLimitResult)
      return createRateLimitResponse(rateLimitResult.retryAfter, rateLimitResult.error)
    }

    // Parse and validate request body
    const body = await request.json()
    console.log('Request body:', { email: body.email, hasPassword: !!body.password })
    
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      console.log('Validation failed:', result.error.issues)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input',
          details: result.error.issues 
        },
        { status: 400 }
      )
    }

    const { email, password } = result.data
    console.log('Creating Supabase client...')
    const supabase = createClient()

    // Attempt sign in
    console.log('Attempting authentication...')
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !user) {
      console.error('Authentication failed:', {
        error: signInError?.message,
        errorCode: signInError?.status,
        email
      })
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication failed',
          details: signInError?.message || 'Invalid credentials'
        },
        { status: 401 }
      )
    }

    console.log('Authentication successful:', {
      userId: user.id,
      email: user.email,
      metadata: user.user_metadata
    })

    // Fetch user profile
    console.log('Fetching user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('employees')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile fetch failed:', {
        error: profileError?.message,
        code: profileError?.code,
        userId: user.id
      })
      return NextResponse.json(
        { 
          success: false, 
          error: 'Profile fetch failed',
          details: profileError?.message || 'Profile not found'
        },
        { status: 500 }
      )
    }

    console.log('Profile fetched successfully:', {
      employeeId: profile.id,
      role: profile.role
    })

    // Set cookie options
    const cookieStore = cookies()
    const cookieOptions: ResponseCookie = {
      name: 'sb-token',
      value: user.id,
      domain: process.env.NEXT_PUBLIC_SITE_URL,
      maxAge: 34560000, // 400 days
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    }

    console.log('Setting authentication cookie:', {
      domain: cookieOptions.domain,
      maxAge: cookieOptions.maxAge,
      secure: cookieOptions.secure
    })

    // Set the cookie
    cookieStore.set(cookieOptions)

    // Log session information if available
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      console.log('Session details:', {
        expiresAt: new Date(session.expires_at! * 1000).toISOString(),
        tokenType: session.token_type,
        hasRefreshToken: !!session.refresh_token
      })
    }

    console.log('=== Login successful ===')

    // Return success response with user data
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
        profile,
        redirectTo: '/dashboard'
      },
      {
        status: 200,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        }
      }
    )
  } catch (error) {
    console.error('Unexpected error during login:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? 
          error instanceof Error ? error.message : 'Unknown error' 
          : 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
} 