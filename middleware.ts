import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/reset-password', '/auth/callback']

// Routes that require authentication
const protectedRoutes = ['/overview', '/schedule', '/profile', '/time-off']

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

  await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Handle public routes - redirect to overview if authenticated
  if (publicRoutes.includes(pathname)) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      return NextResponse.redirect(new URL('/overview', request.url))
    }
    return response
  }

  // Handle protected routes - redirect to login if not authenticated
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user has completed profile
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('auth_id', session.user.id)
      .single()

    if (!employee) {
      return NextResponse.redirect(new URL('/complete-profile', request.url))
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 