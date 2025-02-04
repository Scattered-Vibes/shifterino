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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Debug logging
  console.log('--------------------')
  console.log('Middleware Debug:')
  console.log('Original pathname:', pathname)
  
  let response = NextResponse.next({
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
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    // Check auth session
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Session:', session ? 'exists' : 'null')
    
    // Normalize the pathname
    const normalizedPath = pathname === '/' ? pathname : pathname.toLowerCase().replace(/\/+$/, '')
    console.log('Normalized path:', normalizedPath)

    // Check if the current path is public
    const isPublicRoute = publicRoutes.has(normalizedPath)
    console.log('Is public route:', isPublicRoute)
    console.log('Public routes:', Array.from(publicRoutes))

    // Always allow access to public routes when not authenticated
    if (!session && isPublicRoute) {
      console.log('Allowing access to public route')
      return response
    }

    // If authenticated and trying to access auth pages, redirect to dashboard
    if (session && (normalizedPath === '/login' || normalizedPath === '/signup')) {
      console.log('Authenticated user trying to access auth page, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // For all other routes, require authentication
    if (!session) {
      console.log('Unauthenticated user trying to access protected route, redirecting to login')
      const redirectUrl = new URL('/login', request.url)
      // Store the original URL to redirect back after login
      if (normalizedPath !== '/login') {
        redirectUrl.searchParams.set('redirectedFrom', pathname)
      }
      return NextResponse.redirect(redirectUrl)
    }

    // Auth routes - if logged in, redirect to dashboard
    if (request.nextUrl.pathname.startsWith('/auth')) {
      if (session) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return response
    }

    // Protected routes - if not logged in, redirect to login
    if (
      request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/profile')
    ) {
      if (!session) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }

      // Check if profile is complete when accessing dashboard
      if (request.nextUrl.pathname.startsWith('/dashboard')) {
        const { data: employee, error } = await supabase
          .from('employees')
          .select()
          .eq('auth_id', session.user.id)
          .single()

        if (error || !employee?.first_name || !employee?.last_name) {
          return NextResponse.redirect(new URL('/profile/complete', request.url))
        }
      }

      // Prevent accessing profile completion if profile is already complete
      if (request.nextUrl.pathname === '/profile/complete') {
        const { data: employee, error } = await supabase
          .from('employees')
          .select()
          .eq('auth_id', session.user.id)
          .single()

        if (!error && employee?.first_name && employee?.last_name) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }
    }

    console.log('Allowing access to protected route')
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  } finally {
    console.log('--------------------')
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 