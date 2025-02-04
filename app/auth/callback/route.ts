import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

/**
 * GET authentication callback handler.
 *
 * This endpoint handles the authentication callback by retrieving an authorization code from the
 * query parameters of the incoming request. If a valid code is found, it exchanges the code for a
 * session using the Supabase client. After processing the session exchange, the handler redirects the user
 * to the dashboard page, preserving the original request's origin.
 *
 * @param {Request} request - The incoming HTTP request object.
 * @returns {Promise<Response>} A NextResponse that redirects to the '/overview' page.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL('/overview', request.url))
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL('/auth/auth-error', request.url))
}