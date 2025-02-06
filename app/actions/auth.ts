'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return redirect('/login?error=Invalid credentials')
    }

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return redirect('/login?error=Authentication failed')
    }

    return redirect('/overview')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error // Re-throw redirect errors
    }
    console.error('Sign in error:', error)
    return redirect('/login?error=Unexpected error')
  }
}

export async function signOut() {
  const supabase = createClient()
  
  try {
    await supabase.auth.signOut()
    return redirect('/login')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error // Re-throw redirect errors
    }
    console.error('Sign out error:', error)
    return redirect('/login')
  }
} 