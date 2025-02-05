'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

/**
 * Server action to handle user login
 * Uses Supabase authentication with email/password
 * 
 * @param formData - Form data containing email and password
 * @throws {Error} If login fails or credentials are invalid
 */
export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const returnTo = formData.get('returnTo') as string
  
  if (!email || !password) {
    throw new Error('Email and password are required')
  }
  
  const supabase = createClient()
  
  try {
    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password')
      }
      console.error('Auth error:', error)
      throw new Error('Authentication failed')
    }

    if (!data?.user) {
      throw new Error('Login failed - no user data')
    }

    // Wait briefly for session to be established
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      // Get employee data to check if profile is complete
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('auth_id', data.user.id)
        .single()

      if (employeeError) {
        console.error('Employee fetch error:', employeeError)
        // Don't throw, just redirect to complete profile
        redirect('/complete-profile')
      }

      // Revalidate all pages using the root layout
      revalidatePath('/', 'layout')

      // Redirect based on profile completion and return URL
      if (!employee?.first_name || !employee?.last_name) {
        redirect('/complete-profile')
      }

      // Redirect to return URL or default route
      redirect(returnTo || '/overview')
    } catch (dbError) {
      console.error('Database error:', dbError)
      // If there's a database error, still allow login but redirect to complete profile
      redirect('/complete-profile')
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred during login')
  }
}

/**
 * Server action to handle user sign out
 * Clears the Supabase session and redirects to login
 */
export async function signOut() {
  const supabase = createClient()
  
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    revalidatePath('/', 'layout')
    redirect('/login')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    throw new Error('Failed to sign out')
  }
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          role: 'dispatcher', // Default role
          first_name: '',     // Will be set in complete-profile
          last_name: '',      // Will be set in complete-profile
        }
      },
    })

    if (error) {
      console.error('Signup error:', error)
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