'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/utils/error-handler'

export async function signOut() {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      const appError = handleError(error)
      return { error: appError.message }
    }

    redirect('/login')
  } catch (error) {
    const appError = handleError(error)
    return { error: appError.message }
  }
}