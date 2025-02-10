/**
 * Server-side authentication actions for Next.js App Router
 */

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { handleError, ErrorCode } from '@/lib/utils/error-handler'
import {
  loginSchema,
  signupSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  type LoginInput,
  type SignupInput,
  type ResetPasswordInput,
  type UpdatePasswordInput,
} from '@/lib/validations/schemas'

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
      return { error: appError.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    const appError = handleError(error)
    if (error instanceof z.ZodError) {
      return { 
        error: 'Invalid email or password format',
        code: ErrorCode.VALIDATION_ERROR
      }
    }
    return { error: appError.message, code: appError.code }
  }
}

export async function signup(data: SignupInput) {
  try {
    const validatedFields = signupSchema.parse(data)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: validatedFields.email,
      password: validatedFields.password,
      options: {
        data: {
          role: validatedFields.role,
        },
      },
    })

    if (error) {
      const appError = handleError(error)
      return { error: appError.message }
    }

    redirect('/signup/check-email')
  } catch (error) {
    const appError = handleError(error)
    if (error instanceof z.ZodError) {
      return { 
        error: 'Invalid form data',
        code: ErrorCode.VALIDATION_ERROR
      }
    }
    return { error: appError.message, code: appError.code }
  }
}

export async function signOut() {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      const appError = handleError(error)
      return { error: appError.message }
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
      return { error: appError.message }
    }

    return { success: true }
  } catch (error) {
    const appError = handleError(error)
    if (error instanceof z.ZodError) {
      return { 
        error: 'Invalid email format',
        code: ErrorCode.VALIDATION_ERROR
      }
    }
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
      return { error: appError.message }
    }

    revalidatePath('/', 'layout')
    redirect('/overview')
  } catch (error) {
    const appError = handleError(error)
    if (error instanceof z.ZodError) {
      return { 
        error: 'Invalid password format',
        code: ErrorCode.VALIDATION_ERROR
      }
    }
    return { error: appError.message, code: appError.code }
  }
}
