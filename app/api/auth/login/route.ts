import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { type LoginInput } from '@/lib/validations/schemas'
import { handleError } from '@/lib/utils/error-handler'
import { rateLimit } from '@/middleware/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Apply stricter rate limiting for login
    const rateLimitResult = await rateLimit(request, NextResponse.next())
    
    if (rateLimitResult) {
      return rateLimitResult
    }

    const data = await request.json() as LoginInput
    const cookieStore = cookies()
    const supabase = createServerClient(
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
          remove(name: string) {
            cookieStore.delete(name)
          },
        },
      }
    )

    // Sign in user
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (signInError) {
      return NextResponse.json(
        { error: handleError(signInError).message },
        { status: 400 }
      )
    }

    // Get user after sign in
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Failed to get user details' },
        { status: 400 }
      )
    }

    // Check if user exists in employees table
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, role')
      .eq('auth_id', user.id)
      .single()

    if (employeeError) {
      return NextResponse.json(
        { error: handleError(employeeError).message },
        { status: 400 }
      )
    }

    // Log successful login
    await supabase.from('auth_logs').insert({
      operation: 'login_success',
      user_id: user.id,
      details: { email: data.email },
    })

    // Return redirect URL based on profile completion
    return NextResponse.json({
      redirectTo: employee ? '/overview' : '/complete-profile'
    })
  } catch (error) {
    return NextResponse.json(
      { error: handleError(error).message },
      { status: 500 }
    )
  }
} 