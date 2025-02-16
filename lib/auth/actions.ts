'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
})

export async function updateProfile(
  userId: string,
  data: z.infer<typeof updateProfileSchema>
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('employees')
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
      })
      .eq('auth_id', userId)

    if (error) {
      throw new AppError(
        'Failed to update profile.',
        ErrorCode.DATABASE,
        { message: error.message, code: error.code, details: error.details }
      )
    }

    revalidatePath('/')
    redirect('/dashboard')
  } catch (error) {
    console.error('[updateProfile] Error:', error)
    if (error instanceof AppError) throw error
    throw new AppError(
      'Failed to update profile.',
      ErrorCode.UNKNOWN,
      { message: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}

export async function signOut() {
  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new AppError(
        'Failed to sign out.',
        ErrorCode.INVALID_CREDENTIALS,
        { message: error.message }
      )
    }

    revalidatePath('/', 'layout')
    redirect('/login')
  } catch (error) {
    console.error('[signOut] Error:', error)
    if (error instanceof AppError) throw error
    throw new AppError(
      'Failed to sign out.',
      ErrorCode.UNKNOWN,
      { message: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}

export async function signIn(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new AppError(
        'Failed to sign in.',
        ErrorCode.INVALID_CREDENTIALS,
        { message: error.message }
      )
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    console.error('[signIn] Error:', error)
    if (error instanceof AppError) throw error
    throw new AppError(
      'Failed to sign in.',
      ErrorCode.UNKNOWN,
      { message: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}

export async function signUp(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      throw new AppError(
        'Failed to sign up.',
        ErrorCode.INVALID_CREDENTIALS,
        { message: error.message }
      )
    }

    return { success: true }
  } catch (error) {
    console.error('[signUp] Error:', error)
    if (error instanceof AppError) throw error
    throw new AppError(
      'Failed to sign up.',
      ErrorCode.UNKNOWN,
      { message: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}

export async function resetPassword(formData: FormData) {
  try {
    const email = formData.get('email') as string
    
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    })

    if (error) {
      throw new AppError(
        'Failed to reset password.',
        ErrorCode.INVALID_CREDENTIALS,
        { message: error.message }
      )
    }

    return { success: true }
  } catch (error) {
    console.error('[resetPassword] Error:', error)
    if (error instanceof AppError) throw error
    throw new AppError(
      'Failed to reset password.',
      ErrorCode.UNKNOWN,
      { message: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}

export async function updatePassword(formData: FormData) {
  try {
    const password = formData.get('password') as string
    
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      throw new AppError(
        'Failed to update password.',
        ErrorCode.INVALID_CREDENTIALS,
        { message: error.message }
      )
    }

    return { success: true }
  } catch (error) {
    console.error('[updatePassword] Error:', error)
    if (error instanceof AppError) throw error
    throw new AppError(
      'Failed to update password.',
      ErrorCode.UNKNOWN,
      { message: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
} 