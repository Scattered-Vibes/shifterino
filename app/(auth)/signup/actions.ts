'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AuthError } from '@supabase/supabase-js'

type SignupState = {
  message: string | null
}

export async function signup(prevState: SignupState, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { message: 'Email and password are required' }
  }

  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
      },
    })

    if (error) {
      return { message: `Failed to sign up: ${error.message}` }
    }

    redirect('/signup/check-email')
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: `Failed to sign up: ${error.message}` }
    }
    return { message: 'An unexpected error occurred during signup' }
  }
} 