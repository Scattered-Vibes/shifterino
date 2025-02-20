'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'
import { z } from 'zod'
import { loginSchema } from '@/lib/validations/auth'

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
    const supabase = await createClient()
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
  error?: { message: string }
  redirectTo?: string
  success?: boolean
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

    const supabase = await createClient()

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
          message: signUpError.message
        }
      }
    }

    if (!user) {
      return {
        error: {
          message: 'No user data returned'
        }
      }
    }

    // Create employee record
    const { error: employeeError } = await supabase
      .from('employees')
      .insert({
        user_id: user.id,
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        role: validatedData.role,
      })

    if (employeeError) {
      return {
        error: {
          message: 'Failed to create employee record'
        }
      }
    }

    // Log successful registration
    await supabase.from('auth_logs').insert({
      email: validatedData.email,
      success: true,
      ip_address: '127.0.0.1',
      user_agent: 'Registration Form',
    })

    return {
      success: true,
      redirectTo: validatedData.redirectTo || '/overview'
    }
  } catch (error) {
    console.error('Registration error:', error)
    
    // Log failed registration
    const supabase = await createClient()
    await supabase.from('auth_logs').insert({
      email: formData.get('email')?.toString(),
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error',
      ip_address: '127.0.0.1',
      user_agent: 'Registration Form',
    })

    return {
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
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

    const supabase = await createClient()
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

    const supabase = await createClient()
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

    const supabase = await createClient()
    
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