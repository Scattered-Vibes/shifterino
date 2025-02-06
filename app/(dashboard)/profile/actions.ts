'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = createClient()

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Auth error:', userError)
      throw new Error('Authentication error')
    }
    
    if (!user) {
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

    // Update employee record
    const { error: updateError } = await supabase
      .from('employees')
      .update({
        first_name,
        last_name,
        updated_at: new Date().toISOString(),
      })
      .eq('auth_id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      throw new Error(updateError.message || 'Failed to update profile')
    }

    // Update user metadata
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        first_name,
        last_name,
      }
    })

    if (metadataError) {
      console.error('Error updating user metadata:', metadataError)
      // Don't throw here as the employee record was updated successfully
    }

    // Revalidate only the profile page and its components
    revalidatePath('/profile')
  } catch (error) {
    console.error('Profile update error:', error)
    throw error
  }
} 