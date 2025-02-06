'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { type User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { signOut as signOutAction } from '@/app/(auth)/signout/actions'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  resetPassword: async () => {},
})

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser: User | null
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      setIsLoading(true)
      try {
        if (event === 'SIGNED_IN') {
          // Verify the user with getUser after sign in
          const { data: { user }, error } = await supabase.auth.getUser()
          if (error) {
            console.error('Error verifying user after sign in:', error)
            setUser(null)
            return
          }
          setUser(user)
          router.refresh()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          router.refresh()
          if (!pathname.startsWith('/login')) {
            router.replace('/login')
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, pathname])

  const signOut = async () => {
    setIsLoading(true)
    try {
      await signOutAction()
      // The server action handles the redirect
    } catch (error) {
      console.error('Error signing out:', error)
      
      // Only handle non-redirect errors
      if (error instanceof Error && error.message !== 'NEXT_REDIRECT') {
        setUser(null)
        
        if (error.message === 'SIGNOUT_FAILED') {
          router.replace('/login?error=signout_failed')
        } else {
          router.replace('/login')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      if (data?.user) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/api/auth/callback`,
          data: {
            profile_incomplete: true
          }
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
      })
      if (error) throw error
    } catch (error) {
      console.error('Error resetting password:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    isLoading,
    signOut,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}