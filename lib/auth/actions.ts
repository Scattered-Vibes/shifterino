'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'
import { z } from 'zod'

// Schema definitions
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  role: z.enum(['DISPATCHER', 'SUPERVISOR', 'MANAGER']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const resetPasswordSchema = z.object({
  email: z.string().email(),
})

const updatePasswordSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const updateProfileSchema = z.object({
  auth_id: z.string().uuid(),
  id: z.string().uuid(),
  first_name: z.string().min(2),
  last_name: z.string().min(2),
})

// Type definitions
type AuthState = {
  error?: {
    message: string
    code: string
  }
  message?: string
  success?: boolean
}

// Server Actions
export async function signOut(): Promise<AuthState> {
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

    redirect('/login')
  } catch (error) {
    console.error('[signOut] Error:', error)
    return {
      error: {
        message: 'Failed to sign out.',
        code: ErrorCode.UNKNOWN,
      }
    }
  }
}

export async function login(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  try {
    const validationResult = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
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
    const { data, error } = await supabase.auth.signInWithPassword(validationResult.data)

    if (error) {
      return {
        error: {
          message: error.message,
          code: error.status?.toString() || ErrorCode.UNKNOWN
        }
      }
    }

    if (!data?.session) {
      return {
        error: {
          message: 'Authentication failed',
          code: ErrorCode.UNAUTHORIZED
        }
      }
    }

    const redirectTo = formData.get('redirectTo')?.toString() || '/overview'
    redirect(redirectTo)
  } catch (error) {
    if (error instanceof Error && error.message !== 'NEXT_REDIRECT') {
      return {
        error: {
          message: error.message,
          code: ErrorCode.UNKNOWN
        }
      }
    }
    throw error
  }
}

export async function signUp(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL
    if (!origin) {
      return {
        error: {
          message: "Missing NEXT_PUBLIC_APP_URL environment variable",
          code: ErrorCode.SERVER_ERROR,
        },
      }
    }

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
        emailRedirectTo: `${origin}/auth/callback?next=/complete-profile`,
        data: {
          first_name: validationResult.data.first_name,
          last_name: validationResult.data.last_name,
          role: validationResult.data.role,
          profile_incomplete: true
        },
      }
    })

    if (error) {
      return {
        error: {
          message: error.message,
          code: ErrorCode.INVALID_CREDENTIALS
        }
      }
    }

    redirect('/signup/check-email')
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: ErrorCode.UNKNOWN
      }
    }
  }
}

export async function resetPassword(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL
    if (!origin) {
      return {
        error: {
          message: "Missing NEXT_PUBLIC_APP_URL environment variable",
          code: ErrorCode.SERVER_ERROR,
        },
      }
    }

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
        redirectTo: `${origin}/auth/callback?next=/update-password`
      }
    )

    if (error) {
      return {
        error: {
          message: error.message,
          code: ErrorCode.OPERATION_FAILED
        }
      }
    }

    return { message: 'Password reset link sent' }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: ErrorCode.UNKNOWN
      }
    }
  }
}

export async function updatePassword(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
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
      return {
        error: {
          message: error.message,
          code: ErrorCode.OPERATION_FAILED
        }
      }
    }

    redirect('/login')
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: ErrorCode.UNKNOWN
      }
    }
  }
}

export async function updateProfile(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  try {
    const validationResult = updateProfileSchema.safeParse({
      auth_id: formData.get('auth_id'),
      id: formData.get('id'),
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
      .eq('id', validationResult.data.id)

    if (employeeError) {
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
        first_name: validationResult.data.first_name,
        last_name: validationResult.data.last_name,
      }
    })

    if (updateError) {
      return {
        error: {
          message: updateError.message,
          code: ErrorCode.OPERATION_FAILED
        }
      }
    }

    return { success: true }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: ErrorCode.UNKNOWN
      }
    }
  }
} 