'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { signOut } from '@/app/(auth)/signout/actions'

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
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error('Auth error:', signInError.message, signInError.status)
      if (signInError.message.includes('Invalid login credentials')) {
        return { message: 'Invalid email or password' }
      }
      if (signInError.status === 429) {
        return { message: 'Too many login attempts. Please try again later.' }
      }
      if (signInError.status === 400) {
        return { message: 'Invalid email format or password requirements not met' }
      }
      return { message: 'Authentication failed. Please try again.' }
    }

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Error verifying user after login:', userError)
      await signOut()
      return { message: 'Authentication failed' }
    }

    // Get employee data
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (employeeError) {
      console.error('Error fetching employee data:', employeeError)
      await signOut()
      return { message: 'Failed to fetch employee data' }
    }

    // If employee record exists but profile is incomplete
    if (!employee.first_name || !employee.last_name) {
      redirect('/complete-profile')
    }

    // Revalidate all pages that might show user data
    revalidatePath('/', 'layout')

    // Redirect based on role or return URL
    redirect(returnTo || (employee.role === 'supervisor' ? '/manage' : '/overview'))
  } catch (error) {
    console.error('Login error:', error)
    return { message: 'An unexpected error occurred' }
  }
}

// Re-export the centralized signOut action
export { signOut }

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
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
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

    return redirect('/signup/check-email')
  } catch (error) {
    console.error('Failed to sign up:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to sign up: ${error.message}`)
    }
    throw error
  }
}