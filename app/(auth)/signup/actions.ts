'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Simplified email regex that's more reliable
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/

export async function signup(prevState: any, formData: FormData) {
  try {
    const email = formData.get('email')
    const password = formData.get('password')
    const confirmPassword = formData.get('confirmPassword')

    // Validate required fields
    if (!email || !password || !confirmPassword) {
      return { message: 'Please fill in all fields' }
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email as string)) {
      return { message: 'Please enter a valid email address' }
    }

    // Validate password requirements
    if (!PASSWORD_REGEX.test(password as string)) {
      return { message: 'Password must be at least 8 characters and contain uppercase, lowercase, and numbers' }
    }

    // Validate password match
    if (password !== confirmPassword) {
      return { message: 'Passwords do not match' }
    }

    // Get site URL with fallback for development
    const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const supabase = createClient()

    // Attempt to sign up - Supabase handles duplicate email checking
    const { error: signUpError } = await supabase.auth.signUp({
      email: email as string,
      password: password as string,
      options: {
        emailRedirectTo: `${redirectUrl}/auth/callback`,
        data: {
          role: 'dispatcher',
          first_name: '',
          last_name: ''
        }
      },
    })

    if (signUpError) {
      console.error('Signup error details:', {
        message: signUpError.message,
        code: signUpError.status,
        name: signUpError.name
      })
      
      // Handle specific error cases
      if (signUpError.message.includes('User already registered')) {
        return { message: 'An account with this email already exists' }
      }
      
      if (signUpError.message.includes('Database error finding user')) {
        console.error('Database initialization error - attempting signup')
        return { 
          message: 'Unable to create account at this time. Please wait a moment and try again. Our system is completing initialization.'
        }
      }

      // Generic error fallback
      return { 
        message: 'Unable to create your account. Please try again. If the problem persists, contact support.'
      }
    }

    redirect('/login?message=Check your email to confirm your account')
  } catch (err) {
    console.error('Signup process error:', err)
    return { 
      message: err instanceof Error ? err.message : 'An unexpected error occurred during signup'
    }
  }
} 