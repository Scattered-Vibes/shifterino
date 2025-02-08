import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that don't require authentication
const publicRoutes = [
  '/login',
  '/signup',
  '/reset-password',
  '/auth/callback'
]

// Routes that require a complete profile
const profileRequiredRoutes = [
  '/dashboard',
  '/schedules',
  '/time-off'
]

export async function middleware(request: NextRequest) {
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
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.delete({ name, ...options })
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  // Get the pathname
  const { pathname } = request.nextUrl

  // Handle public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // Redirect to dashboard if already authenticated
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // Check authentication for protected routes
  if (!user || error) {
    // Get the return URL for post-login redirect
    const returnTo = encodeURIComponent(pathname)
    return NextResponse.redirect(new URL(`/login?returnTo=${returnTo}`, request.url))
  }

  // Check profile completion for routes that require it
  if (profileRequiredRoutes.some(route => pathname.startsWith(route))) {
    const { data: profile, error: profileError } = await supabase
      .from('employees')
      .select('id, first_name, last_name')
      .eq('auth_id', user.id)
      .single()

    if (profileError || !profile?.first_name || !profile?.last_name) {
      return NextResponse.redirect(new URL('/complete-profile', request.url))
    }
  }

  return response
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 