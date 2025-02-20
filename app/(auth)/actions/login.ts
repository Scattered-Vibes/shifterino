'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function login(prevState: any, formData: FormData) {
  const cookieStore = cookies()
  const supabase = createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string || '/overview'

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return {
        error: { message: error.message }
      }
    }

    if (!data.user || !data.session) {
      return {
        error: { message: 'Authentication failed' }
      }
    }

    revalidatePath(redirectTo)
    redirect(redirectTo)
  } catch (error) {
    return {
      error: { 
        message: error instanceof Error ? error.message : 'An error occurred during login'
      }
    }
  }
}