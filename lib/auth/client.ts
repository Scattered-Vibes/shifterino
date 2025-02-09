import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function signOut() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw error
  }

  // The redirect to /login will be handled by the middleware
  window.location.href = '/login'
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: { message: error.message } }
  }

  return { data }
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${location.origin}/auth/callback`,
      data: {
        profile_incomplete: true
      }
    },
  })
  
  if (error) {
    return { error: { message: error.message } }
  }
  
  return { data }
}

export async function resetPassword(email: string) {
  const supabase = createClient()
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
  })
  
  if (error) {
    return { error: { message: error.message } }
  }
  
  return { data: null }
} 