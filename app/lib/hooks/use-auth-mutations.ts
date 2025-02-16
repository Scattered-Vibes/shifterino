'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/app/providers/providers'
import { type AuthError, type User, type Session } from '@supabase/supabase-js'

interface AuthCredentials {
  email: string
  password: string
}

interface SignUpCredentials extends AuthCredentials {
  role: string
}

interface ResetPasswordCredentials {
  email: string
}

interface UpdatePasswordCredentials {
  password: string
}

interface AuthResponse<T> {
  data: T | null
  error: AuthError | null
}

interface SignInResponse {
  user: User | null
  session: Session | null
}

interface OAuthResponse {
  provider: string
  url: string
}

/**
 * Hook for handling sign in mutation
 */
export function useSignIn() {
  const queryClient = useQueryClient()
  const { supabase } = useSupabase()

  return useMutation({
    mutationFn: async (credentials: AuthCredentials): Promise<AuthResponse<SignInResponse>> => {
      const { data, error } = await supabase.auth.signInWithPassword(credentials)
      return { 
        data: data ? { user: data.user, session: data.session } : null,
        error 
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}

/**
 * Hook for handling sign up mutation
 */
export function useSignUp() {
  const queryClient = useQueryClient()
  const { supabase } = useSupabase()

  return useMutation({
    mutationFn: async ({ email, password, role }: SignUpCredentials): Promise<AuthResponse<SignInResponse>> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      return { 
        data: data ? { user: data.user, session: data.session } : null,
        error 
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}

/**
 * Hook for handling sign out mutation
 */
export function useSignOut() {
  const queryClient = useQueryClient()
  const { supabase } = useSupabase()

  return useMutation({
    mutationFn: async (): Promise<AuthResponse<null>> => {
      const { error } = await supabase.auth.signOut()
      return { data: null, error }
    },
    onSuccess: () => {
      queryClient.invalidateQueries()
    },
  })
}

/**
 * Hook for handling password reset request
 */
export function useResetPassword() {
  const { supabase } = useSupabase()

  return useMutation({
    mutationFn: async ({ email }: ResetPasswordCredentials): Promise<AuthResponse<null>> => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      return { data: null, error }
    },
  })
}

/**
 * Hook for handling password update
 */
export function useUpdatePassword() {
  const { supabase } = useSupabase()

  return useMutation({
    mutationFn: async ({ password }: UpdatePasswordCredentials): Promise<AuthResponse<User>> => {
      const { data, error } = await supabase.auth.updateUser({ password })
      return { 
        data: data?.user || null,
        error 
      }
    },
  })
}

/**
 * Hook for handling OAuth sign in
 */
export function useOAuthSignIn() {
  const { supabase } = useSupabase()

  return useMutation({
    mutationFn: async (provider: 'google' | 'github'): Promise<AuthResponse<OAuthResponse>> => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (!data?.url) {
        throw new Error('OAuth URL not provided')
      }
      
      return { 
        data: { provider, url: data.url },
        error 
      }
    },
  })
} 