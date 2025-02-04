'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = createClient()

  // Get current session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }

  // Get form data
  const first_name = formData.get('first_name') as string
  const last_name = formData.get('last_name') as string

  if (!first_name || !last_name) {
    throw new Error('First name and last name are required')
  }

  // Update employee record
  const { error } = await supabase
    .from('employees')
    .update({
      first_name,
      last_name,
      updated_at: new Date().toISOString(),
    })
    .eq('auth_id', session.user.id)

  if (error) {
    console.error('Error updating profile:', error)
    throw new Error('Failed to update profile')
  }

  // Revalidate the profile page
  revalidatePath('/profile')
} 