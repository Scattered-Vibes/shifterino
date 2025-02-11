'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import { signupSchema, type SignupInput } from '@/app/lib/validations/schemas'
import { z } from 'zod'

interface DatabaseError extends Error {
  code: string;
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
