/**
 * Server-side authentication actions for Next.js App Router
 */

'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { handleError } from '@/lib/utils/error-handler'
import { type Database } from '@/types/supabase/database'
import { type LoginState, type SignUpState, type ResetPasswordState, type UpdatePasswordState } from '@/app/(auth)/auth'
import { loginSchema, signupSchema, resetPasswordSchema, updatePasswordSchema } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

// 1. Define and export the type
export type SignOut = () => Promise<void>

// 2. Export the server action explicitly
export async function signOut() {
  console.log('[Server] signOut: Starting server-side sign out')
  try {
    console.log('[Server] signOut: Getting cookie store')
    const cookieStore = cookies()
    
    console.log('[Server] signOut: Creating Supabase client')
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            console.log(`[Server] signOut: Getting cookie ${name}`)
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            console.log(`[Server] signOut: Setting cookie ${name}`)
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, _options: CookieOptions) {
            console.log(`[Server] signOut: Removing cookie ${name}`)
            cookieStore.delete(name)
          },
        },
      }
    )

    console.log('[Server] signOut: Verifying current session')
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      console.log('[Server] signOut: Active session found, signing out')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('[Server] signOut: Error during Supabase signOut:', error)
        throw error
      }
      console.log('[Server] signOut: Successfully signed out from Supabase')
    } else {
      console.log('[Server] signOut: No active session found')
    }

    console.log('[Server] signOut: Checking for auth cookie')
    const authCookie = cookieStore.get('sb-auth-token')
    if (authCookie) {
      console.log('[Server] signOut: Clearing auth cookie')
      cookieStore.delete('sb-auth-token')
    }

    console.log('[Server] signOut: Revalidating paths')
    revalidatePath('/', 'layout')
    
    console.log('[Server] signOut: Redirecting to login')
    redirect('/login')
  } catch (error) {
    console.error('[Server] signOut: Error during sign out:', error)
    const result = handleError(error)
    throw new Error(result.message)
  }
}

export async function login(
  _prevState: LoginState | null,
  formData: FormData,
  redirectTo?: string
): Promise<LoginState | null> {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const result = loginSchema.safeParse({ email, password })

    if (!result.success) {
      return {
        error: {
          message: result.error.errors[0].message,
          code: 'VALIDATION_ERROR'
        }
      }
    }

    const supabase = await createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return {
        error: {
          message: signInError.message,
          code: 'AUTH_ERROR'
        }
      }
    }

    // Verify the user was created and logged in
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        error: {
          message: 'Failed to verify login',
          code: 'AUTH_ERROR'
        }
      }
    }

    // Get employee profile to verify it exists
    const { error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (employeeError) {
      return {
        error: {
          message: 'Failed to fetch employee profile',
          code: 'DATABASE_ERROR'
        }
      }
    }

    // Revalidate all pages that might depend on auth state
    revalidatePath('/', 'layout')

    // Only redirect if there are no errors
    if (redirectTo && !redirectTo.startsWith('/login')) {
      redirect(redirectTo)
    }
    
    redirect('/overview')
  } catch (error) {
    // Only handle non-redirect errors
    if (error && typeof error === 'object' && 'digest' in error) {
      // This is a redirect error, let it propagate
      throw error
    }

    console.error('Login error:', error)
    return {
      error: {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      }
    }
  }
}

export async function signup(
  _prevState: SignUpState | null,
  formData: FormData
): Promise<SignUpState | null> {
  try {
    // Extract form data
    const data = {
      email: formData.get('email')?.toString() || '',
      password: formData.get('password')?.toString() || '',
      confirmPassword: formData.get('confirmPassword')?.toString() || '',
      first_name: formData.get('first_name')?.toString() || '',
      last_name: formData.get('last_name')?.toString() || '',
      role: formData.get('role')?.toString() as 'manager' | 'supervisor' | 'dispatcher'
    }

    // Validate the data
    const result = signupSchema.safeParse(data)

    if (!result.success) {
      const firstError = result.error.errors[0]
      return {
        error: {
          message: firstError.message,
          code: 'VALIDATION_ERROR'
        }
      }
    }

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
          remove(name: string, _options: CookieOptions) {
            cookieStore.delete(name)
          },
        },
      }
    )

    const { error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          profile_incomplete: true
        }
      },
    })

    if (signUpError) {
      console.error('Signup error:', signUpError)
      const result = handleError(signUpError)
      return {
        error: {
          message: result.message,
          code: result.code
        }
      }
    }

    revalidatePath('/', 'layout')
    return {
      message: 'Check your email to confirm your account'
    }
  } catch (error) {
    console.error('Unexpected error during signup:', error)
    const result = handleError(error)
    return {
      error: {
        message: result.message,
        code: result.code
      }
    }
  }
}

export async function resetPassword(_prevState: ResetPasswordState | null, formData: FormData): Promise<ResetPasswordState | null> {
  try {
    const email = formData.get('email') as string

    const result = resetPasswordSchema.safeParse({ email })

    if (!result.success) {
      return {
        error: {
          message: result.error.errors[0].message,
          code: 'VALIDATION_ERROR'
        }
      }
    }

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
          remove(name: string, _options: CookieOptions) {
            cookieStore.delete(name)
          },
        },
      }
    )

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    })

    if (error) {
      const result = handleError(error)
      return {
        error: {
          message: result.message,
          code: result.code
        }
      }
    }

    return {
      message: 'Check your email to reset your password'
    }
  } catch (error) {
    const result = handleError(error)
    return {
      error: {
        message: result.message,
        code: result.code
      }
    }
  }
}

export async function updatePassword(_prevState: UpdatePasswordState | null, formData: FormData): Promise<UpdatePasswordState | null> {
  try {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    const result = updatePasswordSchema.safeParse({ password, confirmPassword })

    if (!result.success) {
      return {
        error: {
          message: result.error.errors[0].message,
          code: 'VALIDATION_ERROR'
        }
      }
    }

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
          remove(name: string, _options: CookieOptions) {
            cookieStore.delete(name)
          },
        },
      }
    )

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      const result = handleError(error)
      return {
        error: {
          message: result.message,
          code: result.code
        }
      }
    }

    return {
      message: 'Password updated successfully'
    }
  } catch (error) {
    const result = handleError(error)
    return {
      error: {
        message: result.message,
        code: result.code
      }
    }
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  
  return user
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return user
}

export async function handleSignIn(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    return { error: error.message }
  }
  
  redirect('/dashboard')
}
