'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { type SignupInput } from '@/lib/validations/schemas'
import { handleError } from '@/lib/utils/error-handler'

export async function signup(data: SignupInput) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
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

    const { error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: data.role,
        },
      },
    })

    if (signUpError) {
      return { error: handleError(signUpError).message }
    }

    // Log successful signup
    await supabase.from('auth_logs').insert({
      operation: 'signup_success',
      details: { email: data.email, role: data.role },
    })

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        email: data.email,
        role: data.role,
      })

    if (profileError) {
      return { error: handleError(profileError).message }
    }

    redirect('/auth/check-email')
  } catch (error) {
    return { error: handleError(error).message }
  }
}
