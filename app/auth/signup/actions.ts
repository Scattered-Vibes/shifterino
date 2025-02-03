'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
      },
    })

    if (signUpError) {
      return { error: signUpError.message }
    }

    if (!user) {
      return { error: 'Something went wrong. Please try again.' }
    }

    // Check if employee record exists
    const { data: existingEmployee } = await supabase
      .from('employees')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    // If no employee record exists (trigger didn't work), create one
    if (!existingEmployee) {
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          auth_id: user.id,
          email: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (employeeError) {
        console.error('Failed to create employee record:', employeeError)
        return { error: 'Failed to create employee profile. Please contact support.' }
      }
    }

    return redirect('/auth/check-email')
  } catch (error) {
    console.error('Signup error:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
} 