'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { signOut } from '@/app/(auth)/signout/actions'
import { z } from 'zod'

type LoginState = {
  message?: string | null
  redirect?: string
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

/**
 * Server action to handle user login
 * Uses Supabase authentication with email/password
 * 
 * @param prevState - Previous state of the login process
 * @param formData - Form data containing email and password
 * @throws {Error} If login fails or credentials are invalid
 */
export async function login(formData: FormData): Promise<LoginState> {
  'use server'
  
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const returnTo = formData.get('returnTo') as string

    const supabase = createClient()
    
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (signInError) {
      console.error('Login error:', signInError)
      return {
        message: 'Invalid login credentials'
      }
    }

    if (!user) {
      return {
        message: 'No user found'
      }
    }

    // Get employee data to check role
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('role, first_name')
      .eq('auth_id', user.id)
      .single()

    if (employeeError) {
      console.error('Error fetching employee:', employeeError)
      return {
        message: 'Error fetching employee data'
      }
    }

    // Revalidate relevant paths
    revalidatePath('/')
    revalidatePath('/overview')
    revalidatePath('/manage')

    // Check if profile needs to be completed
    if (!employee.first_name) {
      return {
        redirect: '/complete-profile'
      }
    }

    // Return success state with redirect
    return {
      message: null,
      redirect: returnTo || (employee.role === 'supervisor' ? '/manage' : '/overview')
    }

  } catch (error) {
    console.error('Login error:', error)
    return {
      message: 'An unexpected error occurred'
    }
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