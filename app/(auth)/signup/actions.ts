'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { signUpWithEmail } from '@/lib/auth'

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['dispatcher', 'supervisor']),
})

export async function signup(formData: FormData) {
  try {
    const validatedFields = SignupSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
    })

    const { data, error } = await signUpWithEmail(
      validatedFields.email,
      validatedFields.password
    )

    if (error) {
      console.error('Signup error:', error)
      throw error
    }

    if (!data) {
      throw new Error('No data returned from signup')
    }

    return redirect('/signup/check-email')
  } catch (error) {
    console.error('Failed to sign up:', error)
    if (error instanceof z.ZodError) {
      throw new Error('Invalid form data')
    }
    if (error instanceof Error) {
      throw new Error(`Failed to sign up: ${error.message}`)
    }
    throw error
  }
}
