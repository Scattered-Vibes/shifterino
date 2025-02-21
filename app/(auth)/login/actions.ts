'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'

export async function login(formData: FormData) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[login:${requestId}] Starting login attempt`)

  try {
    const supabase = createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const redirectTo = (formData.get('redirectTo') as string) || '/overview'

    // Validate input
    if (!email || !password) {
      console.error(`[login:${requestId}] Missing credentials`)
      return { error: 'Email and password are required' }
    }

    // Log initial state
    const cookiesBefore = cookies().getAll()
    console.log(`[login:${requestId}] Initial state:`, {
      email,
      redirectTo,
      cookieCount: cookiesBefore.length,
      cookieNames: cookiesBefore.map(c => c.name),
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
    })

    // Attempt login
    console.log(`[login:${requestId}] Calling signInWithPassword`)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error(`[login:${requestId}] Login failed:`, {
        error: error.message,
        code: error.status,
        name: error.name
      })
      return { error: error.message }
    }

    if (!data.session) {
      console.error(`[login:${requestId}] No session established`)
      return { error: 'Authentication failed - no session established' }
    }

    // Verify session was established
    console.log(`[login:${requestId}] Verifying session`)
    const { data: { session: verifySession }, error: verifyError } = await supabase.auth.getSession()
    
    if (verifyError || !verifySession) {
      console.error(`[login:${requestId}] Session verification failed:`, {
        error: verifyError?.message,
        hasSession: !!verifySession
      })
      return { error: 'Session verification failed' }
    }

    // Log final state with cookie changes
    const cookiesAfter = cookies().getAll()
    const addedCookies = cookiesAfter
      .filter(c => !cookiesBefore.find(bc => bc.name === c.name))
      .map(c => c.name)

    console.log(`[login:${requestId}] Login successful:`, {
      userId: data.session.user.id,
      email: data.session.user.email,
      expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
      cookieChanges: {
        before: cookiesBefore.map(c => c.name),
        after: cookiesAfter.map(c => c.name),
        added: addedCookies
      }
    })

    // Ensure cookies are set before redirect
    if (addedCookies.length === 0) {
      console.error(`[login:${requestId}] No auth cookies were set`)
      return { error: 'Session cookies not established' }
    }
    
    // Check user metadata and role
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error(`[login:${requestId}] Failed to get user details:`, userError)
      return { error: 'Failed to get user details' }
    }

    // Log user role and metadata
    console.log(`[login:${requestId}] User details:`, {
      role: user?.role,
      metadata: user?.user_metadata
    })
    
    console.log(`[login:${requestId}] Redirecting to:`, redirectTo)
    redirect(redirectTo)
  } catch (error) {
    console.error(`[login:${requestId}] Unexpected error:`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    })
    return { error: 'An unexpected error occurred during login' }
  }
} 