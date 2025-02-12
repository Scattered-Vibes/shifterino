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
  // Create a single response that we'll modify with cookies
  const response = NextResponse.next({
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
          // Set cookie on both request and response
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, _options: CookieOptions) {
          // Remove cookie from both request and response
          request.cookies.delete(name)
          response.cookies.delete(name)
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // Check if the route is public
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return response
  }

  // Get the session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('Session error:', sessionError)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // For manager routes, check if user has manager role
  if (MANAGER_ROUTES.some(route => pathname.startsWith(route))) {
    const { data: employee } = await supabase
      .from('employees')
      .select('role')
      .eq('auth_id', session.user.id)
      .single()

    if (!employee || employee.role !== 'manager') {
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