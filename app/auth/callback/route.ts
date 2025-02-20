import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (!code) {
    console.error('[auth/callback] No code provided')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const supabase = createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('[auth/callback] Error exchanging code:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Successful auth, redirect to overview
    return NextResponse.redirect(new URL('/overview', request.url))
  } catch (error) {
    console.error('[auth/callback] Unexpected error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
} 