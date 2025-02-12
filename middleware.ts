import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/reset-password',
  '/auth/callback',
  '/auth/confirm',
  '/complete-profile',
  '/_next',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/reset-password',
  '/api/auth/callback',
]

// Routes that require manager role
const MANAGER_ROUTES = [
  '/manage/employees',
  '/manage/settings',
  '/manage/requirements',
  '/api/admin',
]

export async function middleware(request: NextRequest) {
  console.log('=== Starting middleware authentication check ===')
  console.log('Request path:', request.nextUrl.pathname)
  
  try {
    const { pathname } = request.nextUrl

    // Check if the route is public
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
      console.log('Public route accessed:', pathname)
      return NextResponse.next()
    }

    console.log('Protected route accessed:', pathname)

    // Create a new response to modify
    let response = NextResponse.next()

    // Create Supabase client with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = request.cookies.get(name)
            console.log('Reading cookie:', { 
              name, 
              exists: !!cookie,
              value: cookie ? '[PRESENT]' : '[NOT FOUND]'
            })
            return cookie?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            console.log('Setting cookie:', { 
              name, 
              options: {
                ...options,
                value: name.includes('token') ? '[REDACTED]' : value
              }
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, _options: CookieOptions) {
            console.log('Removing cookie:', { name })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.delete(name)
          },
        },
        auth: {
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true
        }
      }
    )

    // First check if we have a session
    console.log('Checking session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', {
        message: sessionError.message,
        status: sessionError.status,
        name: sessionError.name
      })
      // For API routes, return JSON error
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { error: 'Authentication failed', code: 'SESSION_ERROR' },
          { status: 401 }
        )
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (!session) {
      console.log('No session found, redirecting to login')
      // For API routes, return JSON error
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'NO_SESSION' },
          { status: 401 }
        )
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    console.log('Session found:', {
      userId: session.user.id,
      expiresAt: new Date(session.expires_at! * 1000).toISOString(),
      hasUser: !!session.user
    })

    // Then verify the user with a fresh request to Supabase
    console.log('Verifying user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('User verification failed:', {
        error: userError?.message,
        status: userError?.status,
        userId: session.user.id
      })
      // For API routes, return JSON error
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { error: 'User verification failed', code: 'INVALID_USER' },
          { status: 401 }
        )
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    console.log('User verified:', {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata
    })

    // For manager routes, check if user has manager role
    if (MANAGER_ROUTES.some(route => pathname.startsWith(route))) {
      console.log('Manager route accessed, checking role...')
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('role')
        .eq('auth_id', user.id)
        .single()

      if (employeeError) {
        console.error('Error fetching employee role:', {
          error: employeeError.message,
          code: employeeError.code,
          userId: user.id
        })
        // For API routes, return JSON error
        if (pathname.startsWith('/api')) {
          return NextResponse.json(
            { error: 'Failed to verify role', code: 'ROLE_VERIFICATION_ERROR' },
            { status: 500 }
          )
        }
        return NextResponse.redirect(new URL('/overview', request.url))
      }

      if (!employee || employee.role !== 'manager') {
        console.log('Access denied: User is not a manager', {
          userId: user.id,
          actualRole: employee?.role
        })
        // For API routes, return JSON error
        if (pathname.startsWith('/api')) {
          return NextResponse.json(
            { error: 'Manager role required', code: 'INSUFFICIENT_ROLE' },
            { status: 403 }
          )
        }
        return NextResponse.redirect(new URL('/overview', request.url))
      }

      console.log('Manager role verified')
    }

    console.log('=== Authentication check completed successfully ===')
    return response
  } catch (error) {
    console.error('Middleware error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    // For API routes, return JSON error
    if (request.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Internal server error', code: 'MIDDLEWARE_ERROR' },
        { status: 500 }
      )
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 