import { createBrowserClient } from '@supabase/ssr'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'
import type { Database } from '@/types/supabase/database'

export async function signIn(email: string, password: string) {
  console.log('[signIn] Attempting sign in for email:', email)
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    console.log('[signIn] Sign in result:', { 
      success: !!data.user,
      userId: data.user?.id,
      error: error?.message
    })

    if (error) throw error
    return { data }
  } catch (error) {
    console.error('[signIn] Sign in error:', error)
    throw new AppError(
      'Failed to sign in.',
      ErrorCode.UNAUTHORIZED,
      { message: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}

export async function signUp(email: string, password: string) {
  console.log('[signUp] Attempting sign up for email:', email)
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    console.log('[signUp] Sign up result:', {
      success: !!data.user,
      userId: data.user?.id,
      error: error?.message
    })

    if (error) throw error
    return { data }
  } catch (error) {
    console.error('[signUp] Sign up error:', error)
    throw new AppError(
      'Failed to sign up.',
      ErrorCode.VALIDATION,
      { message: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}

export async function signOut() {
  console.log('[signOut] Attempting sign out')
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  try {
    const { error } = await supabase.auth.signOut()
    console.log('[signOut] Sign out result:', { error: error?.message })
    
    if (error) throw error
  } catch (error) {
    console.error('[signOut] Sign out error:', error)
    throw new AppError(
      'Failed to sign out.',
      ErrorCode.OPERATION_FAILED,
      { message: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}

export async function resetPassword(email: string) {
  console.log('[resetPassword] Attempting password reset for email:', email)
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    
    console.log('[resetPassword] Password reset result:', { error: error?.message })
    
    if (error) throw error
  } catch (error) {
    console.error('[resetPassword] Password reset error:', error)
    throw new AppError(
      'Failed to reset password.',
      ErrorCode.VALIDATION,
      { message: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}

export async function updatePassword(password: string) {
  console.log('[updatePassword] Attempting password update')
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    })
    
    console.log('[updatePassword] Password update result:', { error: error?.message })
    
    if (error) throw error
  } catch (error) {
    console.error('[updatePassword] Password update error:', error)
    throw new AppError(
      'Failed to update password.',
      ErrorCode.VALIDATION,
      { message: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}

// Re-export core functions
export * from './core' 