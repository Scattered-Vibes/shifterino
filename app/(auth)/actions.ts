/**
 * Server-side authentication actions for Next.js App Router
 */

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'
import type { Database } from '@/types/supabase/database'
import type { 
  LoginState, 
  SignUpState, 
  ResetPasswordState, 
  UpdatePasswordState, 
  UpdateProfileState 
} from '@/types/auth'
import {
  loginSchema,
  signupSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  type LoginInput,
  type SignupInput,
  type ResetPasswordInput,
  type UpdatePasswordInput,
} from '@/lib/validations/auth'
import type { User } from '@supabase/supabase-js'
import { z } from 'zod'

// 1. Define and export the type
export type SignOutState = { error: { message: string; code?: string } } | null

// 2. Export the server action explicitly
export async function signOut(): Promise<SignOutState> {
  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('[signOut] Error:', error)
      return {
        error: {
          message: 'Failed to sign out.',
          code: ErrorCode.OPERATION_FAILED,
        },
      }
    }

    // Only redirect after successful signout
    redirect('/login')
  } catch (error) {
    console.error('[signOut] Error:', error)
    // Return consistent error format
    if (error instanceof AppError) {
      return {
        error: {
          message: 'Failed to sign out.',
          code: ErrorCode.UNKNOWN,
        }
      }
    }
    return {
      error: {
        message: 'Failed to sign out.',
        code: ErrorCode.UNKNOWN,
      }
    }
  }
}

export async function login(
  prevState: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  console.log('[login] Starting login action')
  try {
    const validationResult = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!validationResult.success) {
      console.log('[login] Validation failed:', validationResult.error.errors)
      return {
        error: {
          message: validationResult.error.errors[0].message,
          code: ErrorCode.VALIDATION
        }
      }
    }

    console.log("[login] Data valid")
    const supabase = await createServerSupabaseClient()
    
    // Attempt login
    console.log('[login] Attempting sign in')
    const { data, error } = await supabase.auth.signInWithPassword(validationResult.data)
    console.log('[login] Sign in result:', { 
      success: !!data?.session,
      error: error?.message 
    })

    if (error) {
      console.log('[login] Sign in error:', error)
      return {
        error: {
          message: error.message,
          code: error.status?.toString()
        }
      }
    }

    if (!data?.session) {
      console.log('[login] No session in sign in response')
      return {
        error: {
          message: 'Authentication failed',
          code: ErrorCode.UNAUTHORIZED
        }
      }
    }

    // Get the redirect path and redirect immediately
    const redirectTo = formData.get('redirectTo')?.toString() || '/overview'
    console.log('[login] Login successful, redirecting to:', redirectTo)
    redirect(redirectTo)
    // No return statement after redirect

  } catch (error) {
    // Only catch non-redirect errors
    if (error instanceof Error && error.message !== 'NEXT_REDIRECT') {
      console.error('[login] Unexpected error:', error)
      return {
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          code: ErrorCode.UNKNOWN
        }
      }
    }
    throw error // Re-throw redirect error
  }
}

export async function signUp(
  prevState: SignUpState | null,
  formData: FormData
): Promise<SignUpState> {
  try {
    const validationResult = signupSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      role: formData.get('role'),
    })

    if (!validationResult.success) {
      return {
        error: {
          message: validationResult.error.errors[0].message,
          code: ErrorCode.VALIDATION
        }
      }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.signUp({
      email: validationResult.data.email,
      password: validationResult.data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: {
          first_name: validationResult.data.first_name,
          last_name: validationResult.data.last_name,
          role: validationResult.data.role,
          profile_incomplete: true
        }
      }
    })

    if (error) {
      console.error('[signUp] Error:', error)
      return {
        error: {
          message: error.message,
          code: ErrorCode.INVALID_CREDENTIALS
        }
      }
    }

    // Redirect immediately on success
    console.log('[signUp] Signup successful, redirecting to check email page')
    redirect('/auth/check-email')

  } catch (error) {
    console.error('[signUp] Error:', error)
    return {
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: ErrorCode.UNKNOWN
      }
    }
  }
}

export async function resetPassword(
  prevState: ResetPasswordState | null,
  formData: FormData
): Promise<ResetPasswordState> {
  try {
    const validationResult = resetPasswordSchema.safeParse({
      email: formData.get('email')
    })

    if (!validationResult.success) {
      return {
        error: {
          message: validationResult.error.errors[0].message,
          code: ErrorCode.VALIDATION
        }
      }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.resetPasswordForEmail(
      validationResult.data.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/update-password`
      }
    )

    if (error) {
      console.error('[resetPassword] Error:', error)
      return {
        error: {
          message: error.message,
          code: ErrorCode.OPERATION_FAILED
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[resetPassword] Error:', error)
    return {
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: ErrorCode.UNKNOWN
      }
    }
  }
}

export async function updatePassword(
  prevState: UpdatePasswordState | null,
  formData: FormData
): Promise<UpdatePasswordState> {
  try {
    const validationResult = updatePasswordSchema.safeParse({
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword')
    })

    if (!validationResult.success) {
      return {
        error: {
          message: validationResult.error.errors[0].message,
          code: ErrorCode.VALIDATION
        }
      }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.updateUser({
      password: validationResult.data.password
    })

    if (error) {
      console.error('[updatePassword] Error:', error)
      return {
        error: {
          message: error.message,
          code: ErrorCode.OPERATION_FAILED
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[updatePassword] Error:', error)
    return {
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: ErrorCode.UNKNOWN
      }
    }
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('[getCurrentUser] Error:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('[getCurrentUser] Error:', error)
    return null
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return user
}

export async function handleSignIn(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  
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

export async function updateProfile(
  prevState: UpdateProfileState | null,
  formData: FormData
): Promise<UpdateProfileState> {
  try {
    const schema = z.object({
      auth_id: z.string().uuid(),
      first_name: z.string().min(2, { message: "First name must be at least 2 characters." }),
      last_name: z.string().min(2, { message: "Last name must be at least 2 characters." }),
    })

    const validationResult = schema.safeParse({
      auth_id: formData.get('auth_id'),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
    })

    if (!validationResult.success) {
      return {
        error: {
          message: validationResult.error.errors[0].message,
          code: ErrorCode.VALIDATION
        }
      }
    }

    const supabase = await createServerSupabaseClient()

    // Update employee record
    const { error: employeeError } = await supabase
      .from('employees')
      .update({
        first_name: validationResult.data.first_name,
        last_name: validationResult.data.last_name,
        updated_at: new Date().toISOString()
      })
      .eq('auth_id', validationResult.data.auth_id)

    if (employeeError) {
      console.error('[updateProfile] Error updating employee:', employeeError)
      return {
        error: {
          message: 'Error updating employee record',
          code: ErrorCode.DATABASE
        }
      }
    }

    // Update user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        profile_incomplete: false
      }
    })

    if (updateError) {
      console.error('[updateProfile] Error updating user metadata:', updateError)
      return {
        error: {
          message: updateError.message,
          code: ErrorCode.OPERATION_FAILED
        }
      }
    }

    revalidatePath('/', 'layout')
    redirect('/overview')
  } catch (error) {
    console.error('[updateProfile] Error:', error)
    return {
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: ErrorCode.UNKNOWN
      }
    }
  }
}

