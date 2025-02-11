import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Get the pathname
  const path = request.nextUrl.pathname

  // Define public routes that don't require authentication
  const isAuthRoute = path.startsWith('/login') || 
                     path.startsWith('/signup') || 
                     path.startsWith('/reset-password') ||
                     path.startsWith('/auth/')

  // Handle authentication
  if (!session && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/overview', request.url))
  }

  // Handle role-based access
  if (session) {
    try {
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('role, is_active')
        .eq('auth_id', session.user.id)
        .single()

      if (employeeError) {
        console.error('Error fetching employee:', employeeError)
        return NextResponse.redirect(new URL('/error', request.url))
      }

      if (!employee?.is_active) {
        return NextResponse.redirect(new URL('/account-inactive', request.url))
      }

      const isAdminRoute = path.startsWith('/admin')
      const isManagerRoute = path.startsWith('/manage')
      const isScheduleRoute = path.startsWith('/schedule')
      
      if (isAdminRoute && employee?.role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      if (isManagerRoute && !['admin', 'manager', 'supervisor'].includes(employee?.role || '')) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      if (isScheduleRoute && !['admin', 'manager', 'supervisor', 'dispatcher'].includes(employee?.role || '')) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    } catch (error) {
      console.error('Middleware error:', error)
      return NextResponse.redirect(new URL('/error', request.url))
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