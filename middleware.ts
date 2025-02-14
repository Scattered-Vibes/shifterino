import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/reset-password',
  '/auth/callback',
  '/_next',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/reset-password',
  '/api/auth/callback',
  '/api/public',
  '/favicon.ico',
  '/assets',
]

const MANAGER_ROUTES = ['/admin', '/manage']

export async function middleware(request: NextRequest) {
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

    // Check if route requires auth
    const path = request.nextUrl.pathname
    const isPublicRoute = PUBLIC_ROUTES.some(route =>
      path === route || path.startsWith(route + '/')
    )

    if (isPublicRoute) {
      return response
    }

    // Verify auth using both getSession and getUser
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return handleAuthError(response, request)
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return handleAuthError(response, request)
    }

    // Check manager routes
    const isManagerRoute = MANAGER_ROUTES.some(route =>
      path === route || path.startsWith(route + '/')
    )

    if (isManagerRoute) {
      const { data: employee } = await supabase
        .from('employees')
        .select('role')
        .eq('auth_id', user.id)
        .single()

      if (!employee || employee.role !== 'manager') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return handleAuthError(response, request)
  }
}

function handleAuthError(response: NextResponse, request: NextRequest) {
  // Clear any existing auth cookies
  const cookiesToClear = ['sb-access-token', 'sb-refresh-token']
  cookiesToClear.forEach(name => {
    response.cookies.set({
      name,
      value: '',
      expires: new Date(0),
      path: '/',
    })
  })

  const redirectUrl = new URL('/login', request.url)
  redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}