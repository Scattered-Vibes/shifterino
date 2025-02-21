import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/signup', '/reset-password']

// Version check to confirm code execution
console.log('[middleware] Version: 2025-02-22 Corrected Middleware')

export async function middleware(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[middleware:${requestId}] Processing request:`, request.nextUrl.pathname)

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // Create supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            console.log(`[middleware:${requestId}] Getting cookie:`, name)
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            console.log(`[middleware:${requestId}] Setting cookie:`, name)
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            console.log(`[middleware:${requestId}] Removing cookie:`, name)
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Check auth status
    console.log(`[middleware:${requestId}] Checking session`)
    const { data: { session } } = await supabase.auth.getSession()

    // Handle public routes
    if (PUBLIC_ROUTES.includes(request.nextUrl.pathname)) {
      if (session) {
        // If logged in on public route, redirect to dashboard
        console.log(`[middleware:${requestId}] Redirecting authenticated user from public route to dashboard`)
        return NextResponse.redirect(new URL('/overview', request.url))
      }
      console.log(`[middleware:${requestId}] Allowing access to public route:`, request.nextUrl.pathname)
      return response
    }

    // Protected routes
    if (!session && !request.nextUrl.pathname.startsWith('/login')) {
      // If not logged in on protected route, redirect to login
      console.log(`[middleware:${requestId}] No session found, redirecting to login`)
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect logged in users away from auth pages
    if (session && request.nextUrl.pathname.startsWith('/login')) {
      console.log(`[middleware:${requestId}] Redirecting authenticated user from login page to dashboard`)
      return NextResponse.redirect(new URL('/overview', request.url))
    }

    // User is authenticated, allow access
    console.log(`[middleware:${requestId}] Session found, allowing access`)
    return response
  } catch (error) {
    // Handle errors
    console.error(`[middleware:${requestId}] Error:`, error)
    
    // On error, redirect to login for safety
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('error', 'An unexpected error occurred')
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 