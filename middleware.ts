import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define route groups
const PUBLIC_ROUTES = ['/login', '/signup', '/reset-password', '/auth/callback']
const ASSET_ROUTES = ['/api/auth', '/_next', '/favicon.ico']
const PROFILE_ROUTES = ['/complete-profile']

export async function middleware(request: NextRequest) {
  // Initialize response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Skip middleware for asset routes
  const pathname = request.nextUrl.pathname
  if (ASSET_ROUTES.some(path => pathname.startsWith(path))) {
    return response
  }

  try {
    // Create supabase client
    const supabase = createClient()

    // Refresh session if needed
    const { data: { session }, error } = await supabase.auth.getSession()

    // Handle auth error
    if (error) {
      console.error('Auth error in middleware:', error)
      return handleAuthError(request)
    }

    // Check if route requires auth
    const requiresAuth = !PUBLIC_ROUTES.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )

    // Redirect if auth is required but no session
    if (requiresAuth && !session) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return handleAuthError(request)
  }
}

function handleAuthError(request: NextRequest) {
  // Clear auth cookies and redirect to login
  const response = NextResponse.redirect(new URL('/login', request.url))
  response.cookies.delete('sb-auth-token')
  return response
}

// Configure middleware to run on specific paths
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