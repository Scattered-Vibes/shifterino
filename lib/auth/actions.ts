'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerClient } from '@/lib/supabase/server'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'
import { z } from 'zod'
import { loginSchema } from '@/lib/validations/auth'
import { ErrorCode as ErrorCodes } from '@/lib/utils/error-codes'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase/database'

// Schema definitions
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
    const supabase = getServerClient()
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

// Note: The login action has been moved to app/(auth)/actions/login.ts
// Import it from there instead of here

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  role: z.enum(['DISPATCHER', 'SUPERVISOR', 'MANAGER']),
  redirectTo: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export type SignUpResult = {
  error?: { 
    message: string
    code?: keyof typeof ErrorCodes 
  }
  success?: boolean
  redirectTo?: string
}

export async function signUp(prevState: SignUpResult | null, formData: FormData): Promise<SignUpResult> {
  try {
    const rawData = {
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      role: formData.get('role'),
      redirectTo: formData.get('redirectTo'),
    }

    const validatedData = signUpSchema.parse(rawData)

    const supabase = getServerClient()

    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          role: validatedData.role,
        },
      },
    })

    if (signUpError) {
      return {
        error: {
          message: signUpError.message,
          code: ErrorCodes.AUTH_ERROR
        }
      }
    }

    if (!user) {
      return {
        error: {
          message: 'No user data returned',
          code: ErrorCodes.AUTH_ERROR
        }
      }
    }

    // Create employee record
    const { error: employeeError } = await supabase
      .from('employees')
      .insert({
        auth_id: user.id,
        email: validatedData.email,
        employee_id: `EMP${user.id.split('-')[0]}`,
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        role: validatedData.role.toLowerCase() as 'dispatcher' | 'supervisor' | 'manager',
        shift_pattern: '4x10',  // Default to 4x10 pattern
        preferred_shift_category: 'day',  // Default to day shift
        weekly_hours_cap: 40,
        max_overtime_hours: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (employeeError) {
      return {
        error: {
          message: 'Failed to create employee record',
          code: ErrorCodes.DB_ERROR
        }
      }
    }

    return {
      success: true,
      redirectTo: validatedData.redirectTo || '/overview'
    }
  } catch (error) {
    console.error('Registration error:', error)
    
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: ErrorCodes.UNKNOWN_ERROR
      }
    }
  }
}

export async function resetPassword(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  try {
    const email = formData.get('email')?.toString()
    if (!email) {
      return {
        error: {
          message: 'Email is required',
          code: ErrorCodes.VALIDATION_ERROR
        }
      }
    }

    const supabase = getServerClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      return {
        error: {
          message: error.message,
          code: ErrorCodes.AUTH_ERROR
        }
      }
    }

    return {
      success: true,
      message: 'Password reset email sent'
    }
  } catch (error) {
    console.error('Reset password error:', error)
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: ErrorCodes.UNKNOWN_ERROR
      }
    }
  }
}

export async function updatePassword(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  try {
    const password = formData.get('password')?.toString()
    if (!password) {
      return {
        error: {
          message: 'Password is required',
          code: ErrorCodes.VALIDATION_ERROR
        }
      }
    }

    const supabase = getServerClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      return {
        error: {
          message: error.message,
          code: ErrorCodes.AUTH_ERROR
        }
      }
    }

    return {
      success: true,
      message: 'Password updated successfully'
    }
  } catch (error) {
    console.error('Update password error:', error)
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: ErrorCodes.UNKNOWN_ERROR
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

    const supabase = getServerClient()
    
    // Start a transaction by using RPC
    const { data: result, error: rpcError } = await supabase.rpc('validate_session', {
      p_auth_id: validationResult.data.auth_id,
      p_employee_id: validationResult.data.id,
      p_first_name: validationResult.data.first_name,
      p_last_name: validationResult.data.last_name
    })

    if (rpcError) {
      console.error('Error updating profile:', rpcError)
      return {
        error: {
          message: rpcError.message,
          code: ErrorCode.DATABASE
        }
      }
    }

    if (!result) {
      return {
        error: {
          message: 'Failed to update profile',
          code: ErrorCode.OPERATION_FAILED
        }
      }
    }

    revalidatePath('/')
    redirect('/overview')
  } catch (error) {
    console.error('Unexpected error in updateProfile:', error)
    return {
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: ErrorCode.UNKNOWN
      }
    }
  }
}

export async function validateSession(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  try {
    const supabase = getServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      return {
        error: {
          message: error.message,
          code: ErrorCodes.AUTH_ERROR
        }
      }
    }

    if (!session) {
      return {
        error: {
          message: 'No active session',
          code: ErrorCodes.UNAUTHORIZED
        }
      }
    }

    return {
      success: true,
      message: 'Session is valid'
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: ErrorCodes.UNKNOWN_ERROR
      }
    }
  }
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const supabase = getServerClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    throw new AppError(error.message, ErrorCode.AUTH_ERROR)
  }

  return data
} 