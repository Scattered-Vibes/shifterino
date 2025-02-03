'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

/**
 * Server action to handle user signup process.
 * Creates both an auth user and employee record in Supabase.
 * 
 * @param formData - Form data containing user signup information
 * @property {string} formData.email - User's email address
 * @property {string} formData.password - User's password
 * @property {string} formData.firstName - User's first name
 * @property {string} formData.lastName - User's last name 
 * @property {string} formData.shiftPattern - User's preferred shift pattern ('pattern_a' or 'pattern_b')
 * 
 * @throws {Error} If signup fails at any step
 * @throws {Error} If no user is returned from auth signup
 * @throws {Error} If employee record creation fails
 * 
 * @returns {Promise<void>} Redirects to email verification page on success
 */
export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const shiftPattern = formData.get('shiftPattern') as string
  
  const supabase = await createClient()
  
  try {
    console.log('Starting signup process for:', email)
    
    // 1. Create auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      }
    })

    if (signUpError || !authData.user) {
      console.error('Auth signup error:', signUpError)
      throw new Error(signUpError?.message || 'Failed to create user account')
    }

    console.log('Auth user created:', authData.user.id)

    // 2. Create employee record with retry logic
    let retryCount = 0
    const maxRetries = 3
    let employeeError = null

    while (retryCount < maxRetries) {
      const { error } = await supabase
        .from('employees')
        .insert({
          auth_id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
          role: 'dispatcher',
          shift_pattern: shiftPattern,
          weekly_hours_cap: 40
        })

      if (!error) {
        console.log('Employee record created successfully')
        redirect('/signup/check-email')
        return
      }

      employeeError = error
      
      // If it's a schema cache miss, wait and retry
      if (error.code === 'PGRST204') {
        console.log(`Retry attempt ${retryCount + 1} for employee creation due to schema cache miss`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
        retryCount++
        continue
      }

      // For other errors, break immediately
      break
    }

    // If we get here, employee creation failed
    console.error('Employee record creation error:', employeeError)
    
    // Attempt to clean up the auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id)
    if (deleteError) {
      console.error('Failed to delete auth user during rollback:', deleteError)
    }

    throw new Error('Failed to create employee record. Please try again.')
  } catch (err) {
    console.error('Signup process error:', err)
    throw err
  }
} 