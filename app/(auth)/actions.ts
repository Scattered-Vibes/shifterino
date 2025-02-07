/**
 * Server-side authentication actions for Next.js App Router
 */

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['dispatcher', 'supervisor']),
})

export async function login(formData: FormData) {
  try {
    const validatedFields = LoginSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: validatedFields.email,
      password: validatedFields.password,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'Invalid email or password format' }
    }
    return { error: 'An unexpected error occurred' }
  }
}

export async function signup(formData: FormData) {
  try {
    const validatedFields = SignupSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
    })

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: validatedFields.email,
      password: validatedFields.password,
      options: {
        data: {
          role: validatedFields.role,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    redirect('/signup/check-email')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'Invalid form data' }
    }
    return { error: 'An unexpected error occurred' }
  }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function resetPassword(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { error: 'An unexpected error occurred' }
  }
}

export async function updatePassword(formData: FormData) {
  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/overview')
}
