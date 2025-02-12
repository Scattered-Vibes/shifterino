'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { signupSchema, type SignupInput } from '@/app/lib/validations/schemas'
import { z } from 'zod'

interface DatabaseError extends Error {
  code: string;
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/overview')
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Check your email to confirm your account' }
}

export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Check your email for the password reset link' }
}

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Password updated successfully' }
}

export async function completeProfile(formData: FormData) {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Authentication required' }
  }

  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const phone = formData.get('phone') as string

  const { error } = await supabase
    .from('employees')
    .update({
      first_name: firstName,
      last_name: lastName,
      phone,
      updated_at: new Date().toISOString(),
    })
    .eq('auth_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/overview')
}

export async function signup(data: SignupInput) {
  try {
    const validatedFields = signupSchema.parse(data)
    const supabase = createClient()

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!siteUrl) {
      throw new Error('Missing NEXT_PUBLIC_SITE_URL environment variable')
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: validatedFields.email,
      password: validatedFields.password,
      options: {
        data: {
          role: validatedFields.role,
          first_name: validatedFields.first_name,
          last_name: validatedFields.last_name,
          profile_incomplete: true
        },
        emailRedirectTo: `${siteUrl}/auth/callback?next=/complete-profile`,
      },
    })

    if (signUpError) {
      console.error('Signup error:', signUpError)
      return { 
        error: signUpError.message,
        code: 'AUTH_ERROR'
      }
    }

    redirect('/auth/check-email')
  } catch (error) {
    console.error('Error in signup:', error)
    
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      return { 
        error: 'Please check your input',
        code: 'VALIDATION_ERROR',
        details: fieldErrors
      }
    }
    
    // Handle known Supabase error codes
    if (error instanceof Error && 'code' in error) {
      const dbError = error as DatabaseError
      switch (dbError.code) {
        case '23505': // unique violation
          return {
            error: 'An account with this email already exists',
            code: 'AUTH_ERROR'
          }
        default:
          return {
            error: 'An unexpected error occurred',
            code: 'UNKNOWN_ERROR'
          }
      }
    }
    
    return { 
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR'
    }
  }
}