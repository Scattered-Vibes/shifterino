'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthError } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'
import { revalidatePath } from 'next/cache'
import { loginSchema } from '@/lib/validations/auth'

interface LoginState {
  error?: { message: string }
  success?: boolean
}

export async function login(prevState: LoginState | null, formData: FormData): Promise<LoginState> {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[login:${requestId}] Processing login request`)

  // Extract form data
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string || '/overview'

  // Validate input
  const result = loginSchema.safeParse({ email, password })
  if (!result.success) {
    console.log(`[login:${requestId}] Validation failed:`, result.error.issues)
    return { 
      error: { 
        message: result.error.issues[0].message 
      } 
    }
  }

  // Create server client
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    console.log(`[login:${requestId}] Attempting authentication`)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error(`[login:${requestId}] Auth error:`, error.message)
      return { error: { message: error.message } }
    }

    console.log(`[login:${requestId}] Login successful, redirecting to:`, redirectTo)
    revalidatePath('/login')
    redirect(redirectTo)
  } catch (error) {
    console.error(`[login:${requestId}] Unexpected error:`, error)
    if (error instanceof AuthError) {
      return { error: { message: error.message } }
    }
    return { error: { message: 'An unexpected error occurred' } }
  }
}