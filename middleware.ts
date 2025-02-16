import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Define paths that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/reset-password',
  '/auth/callback',
  '/auth-error',
  '/unauthorized',
  '/api/auth'
]

// Define paths that require specific roles
const ROLE_PROTECTED_PATHS = {
  '/manage': ['manager', 'supervisor'],
  '/admin': ['manager']
} as const

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const path = requestUrl.pathname

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some(route => path === route || path.startsWith(`${route}/`)) ||
    path.startsWith('/_next') ||
    path.startsWith('/static')
  ) {
    return NextResponse.next()
  }

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        }
        // Intentionally omit set() and remove() to prevent double cookie writing
      }
    }
  )

  try {
    // Only use getSession() for token refresh
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      // Store the original URL to redirect back after login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', path)
      return NextResponse.redirect(redirectUrl)
    }

    const response = NextResponse.next()
    
    // Set cache control headers
    response.headers.set(
      'Cache-Control',
      'no-cache, no-store, max-age=0, must-revalidate'
    )
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('Middleware auth error:', error)
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}