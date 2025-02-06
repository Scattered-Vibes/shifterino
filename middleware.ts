import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { AuthError } from '@supabase/supabase-js'

// Define public routes that don't require auth
const publicRoutes = ['/login', '/signup', '/reset-password', '/auth-error', '/auth/callback']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip auth check for public routes and static assets
  if (
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Create a response object that we can modify
  const response = NextResponse.next({
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
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // First validate user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // If there's no valid user and this isn't a public route, redirect to login
    if ((!user || userError) && !publicRoutes.includes(pathname)) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Handle authenticated user
    if (user) {
      // Special handling for root path
      if (pathname === '/') {
        return NextResponse.redirect(new URL('/overview', request.url))
      }

      // Verify user has necessary database records
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (employeeError || !employee) {
        throw new Error('User not found in database')
      }
    } else if (pathname === '/') {
      // If no user and at root, redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return response
  } catch (error: unknown) {
    console.error('Middleware auth error:', error)
    
    // Don't clear cookies for session missing error on initial load
    if (error instanceof AuthError && error.name !== 'AuthSessionMissingError') {
      // Clear any invalid auth cookies
      const cookiesToClear = ['sb-access-token', 'sb-refresh-token']
      cookiesToClear.forEach(name => {
        response.cookies.set({
          name,
          value: '',
          maxAge: -1,
          path: '/',
        })
      })
    }
    
    // Only redirect to auth-error for non-public routes and non-session-missing errors
    if (!publicRoutes.includes(pathname) && !(error instanceof AuthError && error.name === 'AuthSessionMissingError')) {
      const errorUrl = new URL('/auth-error', request.url)
      errorUrl.searchParams.set('error', 'auth_error')
      errorUrl.searchParams.set('message', 'Please sign in again')
      return NextResponse.redirect(errorUrl)
    }
    
    // For session missing error, just redirect to login
    if (error instanceof AuthError && error.name === 'AuthSessionMissingError' && !publicRoutes.includes(pathname)) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    return response
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