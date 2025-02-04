'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!email || !password || !confirmPassword) {
    throw new Error('Please fill in all fields')
  }

  if (password !== confirmPassword) {
    throw new Error('Passwords do not match')
  }

  const supabase = createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: {
        role: 'dispatcher',
        first_name: '',
        last_name: ''
      }
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  redirect('/login?message=Check your email to confirm your account')
} 