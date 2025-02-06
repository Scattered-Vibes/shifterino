'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AuthError } from '@supabase/supabase-js'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['dispatcher', 'supervisor'], {
    required_error: 'Role is required',
    invalid_type_error: 'Invalid role selected'
  }),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required')
})

type SignupState = {
  message: string | null
}

export async function signup(prevState: SignupState, formData: FormData) {
  try {
    // Extract and validate form data
    const rawFormData = {
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName')
    }

    // Validate form data
    const validatedData = signupSchema.safeParse(rawFormData)
    
    if (!validatedData.success) {
      console.error('Validation error:', validatedData.error)
      return { 
        message: validatedData.error.issues[0].message || 'Please check all required fields' 
      }
    }

    const { email, password, role, firstName, lastName } = validatedData.data

    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
        data: {
          role,
          first_name: firstName,
          last_name: lastName,
          email_verified: false
        }
      },
    })

    if (error) {
      console.error('Signup error:', error)
      return { message: `Failed to sign up: ${error.message}` }
    }

    if (!data.user) {
      console.error('No user returned from signup')
      return { message: 'Failed to create user account' }
    }

    // Wait a short time to allow the trigger function to complete
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verify the user was created properly
    const { data: { user }, error: getUserError } = await supabase.auth.getUser()
    
    if (getUserError || !user) {
      console.error('User verification failed:', getUserError)
      return { message: 'Account created but verification failed. Please contact support.' }
    }

    // Check if the employee record was created
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (employeeError || !employee) {
      console.error('Employee record creation failed:', employeeError)
      return { message: 'Account created but profile setup failed. Please contact support.' }
    }

    redirect('/signup/check-email')
  } catch (error) {
    console.error('Signup error:', error)
    if (error instanceof AuthError) {
      return { message: `Failed to sign up: ${error.message}` }
    }
    return { message: 'An unexpected error occurred during signup' }
  }
} 