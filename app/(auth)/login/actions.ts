'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { generateLogMessage } from '@/lib/utils/logging'

interface LoginState {
  error?: {
    message: string
  }
  success?: boolean
  redirectTo?: string
}

interface Inputs {
  email: string
  password: string
  redirectTo?: string
}

const log = (message: string, data?: Record<string, any>) => {
  generateLogMessage({
    action: 'login',
    message,
    data
  })
}

export async function login(
  prevState: LoginState | null,
  formData: FormData | Inputs
): Promise<LoginState> {
  const actionId = Math.random().toString(36).slice(2)
  log('Starting login action', { actionId })

  try {
    const supabase = createClient()
    const rawFormData = formData instanceof FormData ? Object.fromEntries(formData) : formData
    const email = rawFormData.email as string
    const password = rawFormData.password as string
    const redirectTo = (rawFormData.redirectTo as string) || '/overview'

    if (!email || !password) {
      return { error: { message: 'Email and password are required.' } }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      log('Login failed', { error: error.message, actionId })
      return { error: { message: error.message } }
    }

    if (!data?.user || !data.session) {
      return { error: { message: 'No user or session data returned from authentication.' } }
    }

    log('Login successful', { userId: data.user.id, email: data.user.email, actionId })

    // Ensure session cookies are set
    const { access_token, refresh_token } = data.session
    const cookieStore = cookies()
    cookieStore.set({
      name: 'sb-access-token',
      value: access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
    cookieStore.set({
      name: 'sb-refresh-token',
      value: refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    revalidatePath('/', 'layout')

    // Return state for client-side redirect
    return { success: true, redirectTo }
  } catch (error) {
    log('Unexpected error during login', { error, actionId })
    return { 
      error: { 
        message: error instanceof Error ? error.message : 'An unexpected error occurred.' 
      } 
    }
  }
} 