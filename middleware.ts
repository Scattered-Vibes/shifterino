import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { authDebug } from '@/lib/utils/auth-debug'

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7 // 7 days
}

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password']
const ASSET_ROUTES = ['/api/auth', '/_next', '/favicon.ico']

// Version check to confirm code execution
console.log('[middleware] Version: 2025-02-22 Corrected Middleware')

export async function middleware(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  
  authDebug.debug('Processing request', {
    requestId,
    path: request.nextUrl.pathname,
    method: request.method,
    headers: Object.fromEntries(request.headers)
  })

  // Skip middleware for asset routes
  if (ASSET_ROUTES.some(path => request.nextUrl.pathname.startsWith(path))) {
    authDebug.debug('Asset route skipped', { requestId, path: request.nextUrl.pathname })
    return NextResponse.next()
  }

  // Allow public routes to proceed immediately
  if (PUBLIC_ROUTES.includes(request.nextUrl.pathname)) {
    authDebug.debug('Public route allowed', { requestId, path: request.nextUrl.pathname })
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = request.cookies.get(name)?.value
            authDebug.trackCookie('get', name, value)
            return value
          },
          set(name: string, value: string, options: CookieOptions) {
            const cookieOptions = {
              ...COOKIE_OPTIONS,
              ...options,
            }
            authDebug.trackCookie('set', name, value, cookieOptions)
            request.cookies.set({ name, value, ...cookieOptions })
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name, value, ...cookieOptions })
          },
          remove(name: string, options: CookieOptions) {
            const cookieOptions = {
              ...COOKIE_OPTIONS,
              ...options,
              maxAge: 0,
            }
            authDebug.trackCookie('remove', name, undefined, cookieOptions)
            request.cookies.delete({ name, ...cookieOptions })
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.delete({ name, ...cookieOptions })
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      authDebug.error('Middleware auth error', userError, { requestId, path: request.nextUrl.pathname })
      return redirectToLogin(request)
    }

    if (user) {
      authDebug.info('User authenticated in middleware', {
        requestId,
        userId: user.id,
        path: request.nextUrl.pathname,
        role: user.role,
        email: user.email
      })

      // Add debug headers
      response.headers.set('X-Auth-Debug-User', user.id)
      response.headers.set('X-Auth-Debug-Role', user.role || 'unknown')
      response.headers.set('X-Auth-Debug-Email', user.email || 'unknown')

      // Redirect authenticated users away from auth routes
      const isAuthRoute = request.nextUrl.pathname.startsWith('/(auth)')
      if (isAuthRoute) {
        authDebug.info('Redirecting authenticated user from auth route', {
          requestId,
          userId: user.id,
          path: request.nextUrl.pathname,
          destination: '/overview'
        })
        return NextResponse.redirect(new URL('/overview', request.url))
      }

      return response
    }

    // No user session
    authDebug.debug('No user session in middleware', {
      requestId,
      path: request.nextUrl.pathname
    })
    
    response.headers.set('X-Auth-Debug-Status', 'unauthenticated')
    return redirectToLogin(request)

  } catch (error) {
    authDebug.error('Middleware execution error', error as Error, {
      requestId,
      path: request.nextUrl.pathname
    })
    return redirectToLogin(request)
  }
}

function redirectToLogin(request: NextRequest) {
  const redirectUrl = new URL('/login', request.url)
  if (!PUBLIC_ROUTES.includes(request.nextUrl.pathname)) {
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
  }
  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 