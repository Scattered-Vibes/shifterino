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

export async function login(
  _prevState: LoginState | null,
  formData: FormData,
  redirectTo?: string
): Promise<LoginState | null> {
  try {
    console.log("Starting login process...");
    
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    console.log("Email being used:", email);

    const result = loginSchema.safeParse({ email, password })
    console.log("Validation result:", result.success ? "success" : "failed");

    if (!result.success) {
      return {
        error: {
          message: result.error.errors[0].message,
          code: 'VALIDATION_ERROR'
        }
      }
    }

    console.log("Environment variables:", {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      ANON_KEY_LENGTH: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
    });

    const cookieStore = cookies()
    console.log("Cookie store initialized");
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            console.log(`Getting cookie ${name}:`, cookie?.value ? "exists" : "not found");
            return cookie?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              console.log(`Setting cookie ${name}`);
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              console.error('Error setting cookie:', error)
            }
          },
          remove(name: string, _options: CookieOptions) {
            try {
              console.log(`Removing cookie ${name}`);
              cookieStore.delete(name)
            } catch (error) {
              console.error('Error removing cookie:', error)
            }
          },
        },
      }
    )
    console.log("Supabase client created");

    console.log("Attempting sign in with password...");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    console.log("Sign in attempt completed", error ? "with error" : "successfully");

    if (error) {
      console.error('Login error details:', {
        message: error.message,
        status: error.status,
        name: error.name,
        code: error.code
      })
      const result = handleError(error)
      return {
        error: {
          message: result.message,
          code: result.code
        }
      }
    }

    // Verify the session was created
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('Session verification error:', sessionError)
      return {
        error: {
          message: 'Failed to verify login session',
          code: 'AUTH_ERROR'
        }
      }
    }

    // Get employee profile
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, role')
      .eq('auth_id', session.user.id)
      .single()

    if (employeeError) {
      console.error('Employee fetch error:', employeeError)
      return {
        error: {
          message: 'Failed to fetch employee profile',
          code: 'DATABASE_ERROR'
        }
      }
    }

    // Log successful login
    try {
      await supabase
        .from('audit_logs')
        .insert({
          operation: 'login',
          record_id: session.user.id,
          table_name: 'auth.users',
          changed_by: session.user.id,
          new_data: {
            method: 'password',
            employee_id: employee?.id
          }
        })
    } catch (error) {
      // Non-blocking error
      console.error('Failed to log login:', error)
    }

    // Revalidate all pages that might depend on auth state
    revalidatePath('/', 'layout')

    // Redirect to the appropriate page
    if (redirectTo && !redirectTo.startsWith('/login')) {
      redirect(redirectTo)
    }
    
    redirect('/overview')
  } catch (error) {
    console.error('Unexpected error during login:', error)
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

export async function signup(
  _prevState: SignUpState | null,
  formData: FormData
): Promise<SignUpState | null> {
  try {
    // Extract form data
    const data = {
      email: formData.get('email')?.toString() || '',
      password: formData.get('password')?.toString() || '',
      confirmPassword: formData.get('confirmPassword')?.toString() || '',
      first_name: formData.get('first_name')?.toString() || '',
      last_name: formData.get('last_name')?.toString() || '',
      role: formData.get('role')?.toString() as 'manager' | 'supervisor' | 'dispatcher'
    }

    // Validate the data
    const result = signupSchema.safeParse(data)

    if (!result.success) {
      const firstError = result.error.errors[0]
      return {
        error: {
          message: firstError.message,
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

    const { error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          profile_incomplete: true
        }
      },
    })

    if (signUpError) {
      console.error('Signup error:', signUpError)
      const result = handleError(signUpError)
      return {
        error: {
          message: result.message,
          code: result.code
        }
      }
    }

    revalidatePath('/', 'layout')
    return {
      message: 'Check your email to confirm your account'
    }
  } catch (error) {
    console.error('Unexpected error during signup:', error)
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
