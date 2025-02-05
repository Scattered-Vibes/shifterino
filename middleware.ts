import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Define auth routes that should be accessible without authentication
const publicRoutes = new Set([
  '/login',
  '/signup',
  '/auth/callback',
  '/auth/confirm',
  '/auth/reset-password',
])

// Define routes that require supervisor role
const supervisorRoutes = new Set([
  '/manage',
  '/manage/schedule',
  '/manage/employees',
  '/manage/time-off',
])

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Debug logging
  console.log('--------------------')
  console.log('Middleware Debug:')
  console.log('Original pathname:', pathname)
  
  // Normalize the pathname
  const normalizedPath = pathname === '/' ? pathname : pathname.toLowerCase().replace(/\/+$/, '')
  
  // Check if the current path is public
  const isPublicRoute = publicRoutes.has(normalizedPath)
  const isSupervisorRoute = supervisorRoutes.has(normalizedPath) || normalizedPath.startsWith('/manage/')
  
  console.log('Path info:', {
    normalizedPath,
    isPublicRoute,
    isSupervisorRoute
  })

  // Create response early
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client for auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )

  try {
    // For public routes, don't validate session
    if (isPublicRoute) {
      console.log('Public route - skipping auth check')
      return response
    }

    // Get session for protected routes
    console.log('Checking session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      return redirectToLogin(request)
    }

    // If no session and not a public route, redirect to login
    if (!session) {
      console.log('No session, redirecting to login')
      return redirectToLogin(request)
    }

    console.log('Session found:', {
      userId: session.user.id,
      role: session.user.user_metadata?.role
    })

    // Check role-based access for supervisor routes
    if (isSupervisorRoute) {
      const userRole = session.user.user_metadata?.role

      if (userRole !== 'supervisor') {
        console.log('Access denied: Supervisor role required')
        // Redirect to overview page if not supervisor
        return redirectToOverview(request)
      }
    }

    // Validate session in database
    const sessionId = session.access_token ? 
      JSON.parse(
        Buffer.from(session.access_token.split('.')[1], 'base64').toString()
      ).session_id : null;

    if (!sessionId) {
      console.error('No session ID found in token')
      return redirectToLogin(request)
    }

    console.log('Validating session ID:', sessionId)

    const { data: isValid, error: validationError } = await supabase
      .rpc('validate_session', {
        session_data: {
          session_id: sessionId,
          expires_at: session.expires_at
        }
      })

    if (validationError || !isValid) {
      console.error('Session validation failed:', validationError)
      await supabase.auth.signOut()
      return redirectToLogin(request)
    }

    console.log('Session validated successfully')

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return isPublicRoute ? response : redirectToLogin(request)
  } finally {
    console.log('--------------------')
  }
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  // Only set returnTo if we're not already on a public route
  if (!publicRoutes.has(request.nextUrl.pathname)) {
    url.searchParams.set('returnTo', request.nextUrl.pathname)
  }
  return NextResponse.redirect(url)
}

function redirectToOverview(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/overview'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 