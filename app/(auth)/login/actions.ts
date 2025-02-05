'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

type LoginState = {
  message: string | null
}

/**
 * Server action to handle user login
 * Uses Supabase authentication with email/password
 * 
 * @param prevState - Previous state of the login process
 * @param formData - Form data containing email and password
 * @throws {Error} If login fails or credentials are invalid
 */
export async function login(prevState: LoginState, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const returnTo = formData.get('returnTo') as string
  
  console.log('Login attempt:', { email, returnTo })
  
  if (!email || !password) {
    return { message: 'Email and password are required' }
  }
  
  const supabase = createClient()
  
  try {
    console.log('Attempting Supabase auth...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Auth error:', error.message, error.status)
      if (error.message.includes('Invalid login credentials')) {
        return { message: 'Invalid email or password' }
      }
      if (error.status === 429) {
        return { message: 'Too many login attempts. Please try again later.' }
      }
      if (error.status === 400) {
        return { message: 'Invalid email format or password requirements not met' }
      }
      return { message: 'Authentication failed. Please try again.' }
    }

    if (!data?.user) {
      console.error('Login failed: No user data returned')
      return { message: 'Login failed - please try again' }
    }

    console.log('Auth successful, fetching employee data...')

    try {
      // Get employee data to check if profile is complete and role
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, role')
        .eq('auth_id', data.user.id)
        .single()

      if (employeeError) {
        console.error('Employee fetch error:', employeeError.message, employeeError.code)
        if (employeeError.code === 'PGRST116') {
          console.log('Redirecting to complete profile...')
          redirect('/complete-profile')
        }
        throw new Error(`Failed to fetch employee data: ${employeeError.message}`)
      }

      console.log('Employee data fetched:', employee)

      // Revalidate all pages using the root layout
      revalidatePath('/', 'layout')

      // Redirect based on profile completion
      if (!employee?.first_name || !employee?.last_name) {
        console.log('Profile incomplete, redirecting to complete profile...')
        redirect('/complete-profile')
      }

      // Store role in session metadata
      await supabase.auth.updateUser({
        data: { role: employee.role }
      })

      console.log('Role updated in session, redirecting to:', returnTo || '/overview')

      // Redirect to return URL or default route based on role
      const defaultRoute = employee.role === 'supervisor' ? '/manage' : '/overview'
      redirect(returnTo || defaultRoute)
    } catch (dbError) {
      console.error('Database error:', dbError instanceof Error ? dbError.stack : dbError)
      if (dbError instanceof Error && dbError.message.includes('Failed to fetch employee data')) {
        return { message: 'Unable to access your profile. Please try again.' }
      }
      redirect('/complete-profile')
    }
  } catch (error) {
    console.error('Unexpected error during login:', error instanceof Error ? error.stack : error)
    
    // Handle Next.js redirect "errors" - these are actually expected behavior
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error; // Re-throw to allow Next.js to handle the redirect
    }
    
    return { 
      message: error instanceof Error && error.message && !error.message.includes('NEXT_REDIRECT')
        ? `Login failed: ${error.message}`
        : 'An unexpected error occurred. Please try again.'
    }
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
    if (error) {
      console.error('Sign out error:', error)
      throw error
    }
    
    revalidatePath('/', 'layout')
    redirect('/login')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    console.error('Failed to sign out:', error)
    throw new Error('Failed to sign out')
  }
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as 'dispatcher' | 'supervisor'

  if (!email || !password || !role) {
    throw new Error('Email, password and role are required')
  }

  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          role,
          first_name: '',
          last_name: '',
        }
      },
    })

    if (error) {
      console.error('Signup error:', error)
      throw error
    }

    return redirect('/auth/confirm-email')
  } catch (error) {
    console.error('Failed to sign up:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to sign up: ${error.message}`)
    }
    throw error
  }
}