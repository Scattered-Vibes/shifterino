'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { authDebug } from '@/lib/utils/auth-debug'

export async function login(prevState: any, formData: FormData) {
  const requestId = Math.random().toString(36).substring(7)
  
  authDebug.debug('Login attempt started', { requestId, prevState })

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value
          authDebug.trackCookie('get', name, value)
          return value
        },
        set(name: string, value: string, options: any) {
          authDebug.trackCookie('set', name, value, options)
          authDebug.trace('Cookie set details', { name, valueLength: value.length, options })
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          authDebug.trackCookie('remove', name, undefined, options)
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  authDebug.debug('Environment check', {
    requestId,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKeyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    cookiesPresent: cookieStore.getAll().length > 0
  })

  authDebug.debug('Pre-login state', {
    requestId,
    email,
    cookies: Object.fromEntries(cookieStore.getAll().map(c => [c.name, c.value])),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
  })

  try {
    // Test database connection
    const { data: testData, error: testError } = await supabase
      .from('employees')
      .select('count', { count: 'exact', head: true })
    
    authDebug.debug('Database connection test', {
      requestId,
      success: !testError,
      error: testError?.message,
      rowCount: testData
    })

    // Check if user exists
    const { data: userCheck, error: userCheckError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', email)
      .single()

    authDebug.debug('User existence check', {
      requestId,
      email,
      exists: !!userCheck,
      userId: userCheck?.id,
      error: userCheckError?.message
    })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      authDebug.error('Authentication failed', error, {
        requestId,
        email,
        errorCode: error.code,
        errorStatus: error.status,
        errorDetails: error.message,
        cookies: Object.fromEntries(cookieStore.getAll().map(c => [c.name, c.value]))
      })
      return {
        error: error.message,
        redirectTo: prevState?.redirectTo || '/overview',
      }
    }

    if (!data.session) {
      authDebug.warn('No session returned', {
        requestId,
        userId: data.user?.id,
        email: data.user?.email
      })
      return {
        error: 'No session created',
        redirectTo: prevState?.redirectTo || '/overview',
      }
    }

    authDebug.info('Login successful', {
      requestId,
      userId: data.user?.id,
      email: data.user?.email,
      sessionId: data.session.access_token.substring(0, 8) + '...',
      expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
      tokenLength: data.session.access_token.length
    })

    const sessionData = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at
    }
    
    cookieStore.set({
      name: 'sb-localhost-auth-token',
      value: JSON.stringify(sessionData),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: data.session.expires_in
    })

    const postLoginCookies = Object.fromEntries(
      cookieStore.getAll().map(c => [c.name, c.value])
    )
    
    authDebug.debug('Post-login verification', {
      requestId,
      cookies: postLoginCookies,
      hasAuthToken: !!postLoginCookies['sb-localhost-auth-token'],
      sessionData
    })

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      authDebug.error('Session verification failed', new Error(sessionError?.message || 'No session'), {
        requestId,
        cookies: postLoginCookies
      })
      return {
        error: 'Session verification failed',
        redirectTo: prevState?.redirectTo || '/overview',
      }
    }

    authDebug.debug('Session verified', {
      requestId,
      sessionId: session.access_token.substring(0, 8) + '...',
      expiresAt: new Date(session.expires_at! * 1000).toISOString()
    })

    redirect(prevState?.redirectTo || '/overview')
  } catch (error) {
    authDebug.error('Unexpected login error', error as Error, {
      requestId,
      email,
      cookies: Object.fromEntries(cookieStore.getAll().map(c => [c.name, c.value])),
      stack: (error as Error).stack
    })
    return {
      error: 'Unexpected error during login',
      redirectTo: prevState?.redirectTo || '/overview',
    }
  }
} 