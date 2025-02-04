'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = createClient()

  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('Session error:', sessionError)
      throw new Error('Authentication error')
    }
    
    if (!session) {
      throw new Error('Not authenticated')
    }

    // Get form data
    const first_name = formData.get('first_name')
    const last_name = formData.get('last_name')

    if (!first_name || !last_name || 
        typeof first_name !== 'string' || 
        typeof last_name !== 'string') {
      throw new Error('First name and last name are required')
    }

    // Update employee record with optimistic update
    const { error: updateError } = await supabase
      .from('employees')
      .update({
        first_name,
        last_name,
        updated_at: new Date().toISOString(),
      })
      .eq('auth_id', session.user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      throw new Error(updateError.message || 'Failed to update profile')
    }

    // Revalidate only the profile page and its components
    revalidatePath('/profile')
  } catch (error) {
    console.error('Profile update error:', error)
    throw error
  }
} 