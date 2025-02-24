'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { authDebug } from '@/lib/utils/auth-debug'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'

export async function login(prevState: any, formData: FormData) {
  const requestId = Math.random().toString(36).substring(7)
  
  authDebug.debug('Login attempt started', { 
    requestId, 
    prevState,
    redirectTo: prevState?.redirectTo || '/overview'
  })

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
          cookieStore.set({ 
            name, 
            value, 
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
          })
        },
        remove(name: string, options: any) {
          authDebug.trackCookie('remove', name, undefined, options)
          cookieStore.delete({ 
            name, 
            ...options,
            path: '/'
          })
        },
      },
    }
  )

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    throw new AppError('Email and password are required', ErrorCode.VALIDATION_ERROR)
  }

  try {
    // Attempt sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      authDebug.error('Authentication failed', error, {
        requestId,
        email,
        errorCode: error.code,
        errorStatus: error.status
      })
      
      if (error.status === 400) {
        throw new AppError('Invalid login credentials', ErrorCode.UNAUTHORIZED)
      }
      
      throw new AppError(error.message, ErrorCode.INTERNAL_SERVER_ERROR)
    }

    if (!data.session) {
      throw new AppError('No session created', ErrorCode.INTERNAL_SERVER_ERROR)
    }

    authDebug.info('Login successful', {
      requestId,
      userId: data.user?.id,
      email: data.user?.email,
      sessionId: data.session.access_token.substring(0, 8) + '...',
      redirectTo: prevState?.redirectTo || '/overview'
    })

    // Set session cookies with proper security options
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
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    // Verify session was created and cookies are set
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new AppError('Session verification failed', ErrorCode.INTERNAL_SERVER_ERROR)
    }

    // Verify cookies are set
    const authCookie = cookieStore.get('sb-localhost-auth-token')
    if (!authCookie) {
      throw new AppError('Auth cookie not set', ErrorCode.INTERNAL_SERVER_ERROR)
    }

    authDebug.debug('Session and cookies verified', {
      requestId,
      sessionId: session.access_token.substring(0, 8) + '...',
      hasCookie: !!authCookie
    })

    // Return success state with clean redirect path
    const redirectTo = (prevState?.redirectTo || '/overview').replace(/\/\([^)]+\)/g, '')
    return {
      success: true,
      redirectTo
    }
  } catch (error) {
    if (error instanceof AppError) {
      return {
        error: { message: error.message },
        redirectTo: prevState?.redirectTo || '/overview'
      }
    }

    authDebug.error('Unexpected login error', error as Error, {
      requestId,
      email,
      stack: (error as Error).stack
    })

    return {
      error: { message: 'An unexpected error occurred during login' },
      redirectTo: prevState?.redirectTo || '/overview'
    }
  }
}