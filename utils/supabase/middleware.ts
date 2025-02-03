import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

/**
 * Updates the session and handles auth redirects in middleware
 * 
 * @param request - The incoming request object
 * @returns NextResponse with updated cookies and redirects if needed
 */
export async function updateSession(request: NextRequest) {
  try {
    // Create a new response with the incoming request headers
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Create a Supabase client with cookie handling
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // Set both request and response cookies
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
            // Remove both request and response cookies
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

    try {
      // Get the authenticated user - this validates the session
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      // Handle authentication errors
      if (userError) {
        if (userError.message.includes('Invalid Refresh Token')) {
          // Clear auth cookies on invalid refresh token
          response.cookies.delete('sb-access-token')
          response.cookies.delete('sb-refresh-token')
        }
        
        // For protected routes, redirect to login
        if (request.nextUrl.pathname.startsWith('/dashboard')) {
          const loginUrl = new URL('/login', request.url)
          loginUrl.searchParams.set('error', 'Session expired')
          loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname)
          return NextResponse.redirect(loginUrl)
        }
        
        return response
      }

      // Handle protected routes
      if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('error', 'Authentication required')
        loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Handle auth routes (prevent authenticated users from accessing login/signup)
      if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      return response
    } catch (error) {
      console.error('Error in session update:', error)
      return response
    }
  } catch (error) {
    console.error('Fatal error in updateSession:', error)
    // Return a basic response on fatal errors
    return NextResponse.next()
  }
} 