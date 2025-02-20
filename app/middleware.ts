import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  // Skip middleware for RSC requests
  if (request.nextUrl.searchParams.has('_rsc')) {
    return NextResponse.next()
  }

  console.log('[middleware] Starting middleware check for:', request.url)

  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  console.log('[middleware] Session result:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    error: error?.message,
    userId: session?.user?.id,
    userEmail: session?.user?.email
  })

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                    request.nextUrl.pathname.startsWith('/signup') ||
                    request.nextUrl.pathname.startsWith('/reset-password')

  // Handle profile completion page
  const isProfilePage = request.nextUrl.pathname.startsWith('/complete-profile')

  // If authenticated AND trying to access an auth page, redirect to overview
  if (session?.user && isAuthPage) {
    console.log('[middleware] Authenticated user accessing auth page, redirecting to /overview')
    return NextResponse.redirect(new URL('/overview', request.url))
  }

  // If NOT authenticated and NOT on an auth page, redirect to login
  if (!session?.user && !isAuthPage) {
    console.log('[middleware] No session, redirecting to /login')
    const searchParams = new URLSearchParams()
    searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(new URL(`/login?${searchParams}`, request.url))
  }

  console.log('[middleware] Valid session, proceeding with request')
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - Static files (/_next/, /static/, /images/, etc)
     * - API routes (/api/)
     * - Favicon and other root files
     */
    '/((?!_next|static|images|api|favicon.ico).*)',
  ],
} 