import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/login',
  '/signup', 
  '/reset-password',
  '/auth/callback',
  '/complete-profile',
  '/_next',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/reset-password',
  '/api/auth/callback',
]

const MANAGER_ROUTES = [
  '/manage/employees',
  '/manage/settings',
  '/manage/requirements', 
  '/api/admin',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

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
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: profile, error: profileError } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (profileError) {
    console.error('Error fetching user profile:', profileError)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!profile) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (MANAGER_ROUTES.some(route => pathname.startsWith(route)) && profile.role !== 'manager') {
    return NextResponse.redirect(new URL('/overview', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}