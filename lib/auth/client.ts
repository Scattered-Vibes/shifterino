'use client'

import { createBrowserClient } from '@supabase/ssr'
import { type Database } from '@/types/supabase/database'
import React from 'react'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  window.location.href = '/login'
}

export function getAuthChangeHandler() {
  const supabase = createClient()
  return supabase.auth.onAuthStateChange
}

// Hook for real-time auth state
export function useAuthListener(callback: (event: 'SIGNED_IN' | 'SIGNED_OUT') => void) {
  const supabase = createClient()

  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        callback(event)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [callback])
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