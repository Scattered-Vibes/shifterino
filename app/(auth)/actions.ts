/**
 * Server-side authentication actions for Next.js App Router
 */

'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { handleError } from '@/lib/utils/error-handler'
import { type Database } from '@/types/supabase/database'
import { type LoginState, type SignUpState, type ResetPasswordState, type UpdatePasswordState } from '@/app/(auth)/auth'
import { loginSchema, signupSchema, resetPasswordSchema, updatePasswordSchema } from '@/lib/validations/auth'

export async function login(_prevState: LoginState | null, formData: FormData): Promise<LoginState | null> {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const result = loginSchema.safeParse({ email, password })

    if (!result.success) {
      return {
        error: {
          message: result.error.errors[0].message,
          code: 'VALIDATION_ERROR'
        }
      }
    }

    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, _options: CookieOptions) {
            cookieStore.delete(name)
          },
        },
      }
    )

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error)
      const result = handleError(error)
      return {
        error: {
          message: result.message,
          code: result.code
        }
      }
    }

    // Verify the session was created
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Session verification error:', userError)
      return {
        error: {
          message: 'Failed to verify login session',
          code: 'AUTH_ERROR'
        }
      }
    }

    // Return null to indicate success
    return null;
  } catch (error) {
    const result = handleError(error)
    return {
      error: {
        message: result.message,
        code: result.code
      }
    }
  }
}

export async function logout() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, _options: CookieOptions) {
            cookieStore.delete(name)
          },
        },
      }
    )

    const { error } = await supabase.auth.signOut()

    if (error) {
      const result = handleError(error)
      return {
        error: {
          message: result.message,
          code: result.code
        }
      }
    }

    revalidatePath('/', 'layout')
    redirect('/login')
  } catch (error) {
    const result = handleError(error)
    return {
      error: {
        message: result.message,
        code: result.code
      }
    }
  }
}

export async function signup(_prevState: SignUpState | null, formData: FormData): Promise<SignUpState | null> {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const first_name = formData.get('first_name') as string
    const last_name = formData.get('last_name') as string
    const role = formData.get('role') as 'manager' | 'supervisor' | 'dispatcher'

    const result = signupSchema.safeParse({ 
      email, 
      password, 
      confirmPassword,
      first_name,
      last_name,
      role
    })

    if (!result.success) {
      return {
        error: {
          message: result.error.errors[0].message,
          code: 'VALIDATION_ERROR'
        }
      }
    }

    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, _options: CookieOptions) {
            cookieStore.delete(name)
          },
        },
      }
    )

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          first_name,
          last_name,
          role
        }
      },
    })

    if (error) {
      const result = handleError(error)
      return {
        error: {
          message: result.message,
          code: result.code
        }
      }
    }

    return {
      message: 'Check your email to confirm your account'
    }
  } catch (error) {
    const result = handleError(error)
    return {
      error: {
        message: result.message,
        code: result.code
      }
    }
  }
}

export async function resetPassword(_prevState: ResetPasswordState | null, formData: FormData): Promise<ResetPasswordState | null> {
  try {
    const email = formData.get('email') as string

    const result = resetPasswordSchema.safeParse({ email })

    if (!result.success) {
      return {
        error: {
          message: result.error.errors[0].message,
          code: 'VALIDATION_ERROR'
        }
      }
    }

    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, _options: CookieOptions) {
            cookieStore.delete(name)
          },
        },
      }
    )

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    })

    if (error) {
      const result = handleError(error)
      return {
        error: {
          message: result.message,
          code: result.code
        }
      }
    }

    return {
      message: 'Check your email to reset your password'
    }
  } catch (error) {
    const result = handleError(error)
    return {
      error: {
        message: result.message,
        code: result.code
      }
    }
  }
}

export async function updatePassword(_prevState: UpdatePasswordState | null, formData: FormData): Promise<UpdatePasswordState | null> {
  try {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    const result = updatePasswordSchema.safeParse({ password, confirmPassword })

    if (!result.success) {
      return {
        error: {
          message: result.error.errors[0].message,
          code: 'VALIDATION_ERROR'
        }
      }
    }

    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, _options: CookieOptions) {
            cookieStore.delete(name)
          },
        },
      }
    )

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      const result = handleError(error)
      return {
        error: {
          message: result.message,
          code: result.code
        }
      }
    }

    return {
      message: 'Password updated successfully'
    }
  } catch (error) {
    const result = handleError(error)
    return {
      error: {
        message: result.message,
        code: result.code
      }
    }
  }
}
