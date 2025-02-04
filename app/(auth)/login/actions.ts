'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

/**
 * Server action to handle user login
 * Uses Supabase authentication with email/password
 * 
 * @param formData - Form data containing email and password
 * @throws {Error} If login fails or credentials are invalid
 * @throws {Error} Original error if it's a Next.js redirect
 */
export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  console.log('Attempting login for email:', email)
  
  const cookieStore = cookies()
  const supabase = createClient()
  
  try {
    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error)
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password')
      }
      throw new Error(`Authentication failed: ${error.message}`)
    }

    if (!data?.user) {
      console.error('No user data returned')
      throw new Error('Login failed - no user data')
    }

    console.log('Login successful for user:', data.user.id)

    // Revalidate all pages using the root layout
    revalidatePath('/', 'layout')
    return redirect('/overview')
  } catch (error) {
    // Preserve Next.js redirect errors
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    
    if (error instanceof Error) {
      console.error('Login process error:', error)
      throw error
    }
    throw new Error('An unexpected error occurred during login')
  }
}

/**
 * Server action to handle user sign out
 * Clears the Supabase session and redirects to login
 * 
 * @throws {Error} If sign out fails
 */
export async function signOut() {
  const cookieStore = cookies()
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  return redirect('/login')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const cookieStore = cookies()
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      throw error
    }

    return redirect('/auth/confirm-email')
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to sign up: ${error.message}`)
    }
    throw error
  }
}

export async function logout() {
  const cookieStore = cookies()
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    return redirect('/login')
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to sign out: ${error.message}`)
    }
    throw error
  }
}