/**
 * Server-side authentication actions for Next.js App Router
 */

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createClient } from '@/app/lib/supabase/server'
import { handleError, ErrorCode } from '@/app/lib/utils/error-handler'
import {
  loginSchema,
  signupSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  type LoginInput,
  type SignupInput,
  type ResetPasswordInput,
  type UpdatePasswordInput,
} from '@/app/lib/validations/auth'

export async function login(data: LoginInput) {
  try {
    const validatedFields = loginSchema.parse(data)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: validatedFields.email,
      password: validatedFields.password,
    })

    if (error) {
      const appError = handleError(error)
      return { error: appError.message, code: appError.code }
    }

    revalidatePath('/', 'layout')
    redirect('/overview')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        error: 'Invalid email or password format',
        code: ErrorCode.VALIDATION_ERROR
      }
    }
    const appError = handleError(error)
    return { error: appError.message, code: appError.code }
  }
}

export async function signup(data: SignupInput) {
  try {
    const validatedFields = signupSchema.parse(data)
    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email: validatedFields.email,
      password: validatedFields.password,
      options: {
        data: {
          role: validatedFields.role,
          first_name: validatedFields.first_name,
          last_name: validatedFields.last_name
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/complete-profile`
      },
    })

    if (signUpError) throw signUpError

    redirect('/auth/check-email')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        error: 'Invalid form data',
        code: ErrorCode.VALIDATION_ERROR
      }
    }
    const appError = handleError(error)
    return { error: appError.message, code: appError.code }
  }
}

export async function signOut() {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      const appError = handleError(error)
      return { error: appError.message, code: appError.code }
    }
    
    revalidatePath('/', 'layout')
    redirect('/login')
  } catch (error) {
    const appError = handleError(error)
    return { error: appError.message, code: appError.code }
  }
}

export async function resetPassword(data: ResetPasswordInput) {
  try {
    const validatedFields = resetPasswordSchema.parse(data)
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(validatedFields.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
    })

    if (error) {
      const appError = handleError(error)
      return { error: appError.message, code: appError.code }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        error: 'Invalid email format',
        code: ErrorCode.VALIDATION_ERROR
      }
    }
    const appError = handleError(error)
    return { error: appError.message, code: appError.code }
  }
}

export async function updatePassword(data: UpdatePasswordInput) {
  try {
    const validatedFields = updatePasswordSchema.parse(data)
    const supabase = createClient()
    
    const { error } = await supabase.auth.updateUser({
      password: validatedFields.password,
    })

    if (error) {
      const appError = handleError(error)
      return { error: appError.message, code: appError.code }
    }

    revalidatePath('/', 'layout')
    redirect('/overview')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        error: 'Invalid password format',
        code: ErrorCode.VALIDATION_ERROR
      }
    }
    const appError = handleError(error)
    return { error: appError.message, code: appError.code }
  }
}
