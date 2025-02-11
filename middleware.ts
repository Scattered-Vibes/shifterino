import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/reset-password',
  '/auth/callback',
  '/auth/confirm',
]

// Routes that require manager role
const MANAGER_ROUTES = [
  '/manage/employees',
  '/manage/settings',
  '/manage/requirements',
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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

  const { pathname } = request.nextUrl

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    if (session) {
      // Redirect authenticated users away from auth pages
      return NextResponse.redirect(new URL('/overview', request.url))
    }
    return response
  }

  // Check if user is authenticated
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check manager routes
  if (MANAGER_ROUTES.some(route => pathname.startsWith(route))) {
    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('role')
        .eq('auth_id', session.user.id)
        .single()

      if (employee?.role !== 'manager') {
        return NextResponse.redirect(new URL('/overview', request.url))
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      return NextResponse.redirect(new URL('/overview', request.url))
    }
  }

  return response
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