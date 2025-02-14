import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/login',
  '/signup', 
  '/reset-password',
  '/auth/callback',
  '/complete-profile',
  '/_next',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/reset-password',
  '/api/auth/callback',
  '/api/public',
  '/api/test-auth',
  '/api/auth-debug',
  '/favicon.ico',
  '/assets',
]

const MANAGER_ROUTES = ['/admin', '/manage']

export async function middleware(request: NextRequest) {
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
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              request.cookies.set({
                name,
                value,
                ...options,
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
            } catch (error) {
              console.error('Error setting cookie:', error)
            }
          },
          remove(name: string, _options: CookieOptions) {
            try {
              request.cookies.delete(name)
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              })
              response.cookies.delete(name)
            } catch (error) {
              console.error('Error removing cookie:', error)
            }
          },
        },
      }
    )

    const { pathname } = request.nextUrl
    const isPublicRoute = PUBLIC_ROUTES.some(route => 
      pathname.startsWith(route) || pathname === route
    )

    // Early return for public routes
    if (isPublicRoute) {
      return response
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      await supabase.auth.signOut()
      
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Handle authentication based routes
    if (!session) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check manager routes
    if (MANAGER_ROUTES.some(route => pathname.startsWith(route))) {
      const { data: profile } = await supabase
        .from('employees')
        .select('role')
        .eq('auth_id', session.user.id)
        .single()

      if (!profile || profile.role !== 'manager') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // Add auth context headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', session.user.id)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('Middleware error:', error)
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}