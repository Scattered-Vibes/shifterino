import { getServerClient } from '@/lib/supabase/server'
import { type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { authDebug } from '@/lib/utils/auth-debug'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7 // 7 days
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/overview'
  
  if (code) {
    const supabase = getServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      return Response.redirect(`${requestUrl.origin}/login?error=${error.message}`)
    }
  }

  // URL to redirect to after sign in process completes
  return Response.redirect(`${requestUrl.origin}${next}`)
}
