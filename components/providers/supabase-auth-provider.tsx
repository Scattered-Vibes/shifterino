'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type SupabaseContext = {
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
}

const Context = createContext<SupabaseContext>({
  user: null,
  isLoading: true,
  signOut: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
})

export function SupabaseAuthProvider({
  children,
  session,
}: {
  children: React.ReactNode
  session: { user: User } | null
}) {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(session?.user ?? null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)

      if (event === 'SIGNED_IN') {
        router.refresh()
      }
      if (event === 'SIGNED_OUT') {
        router.refresh()
        router.push('/auth/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const signOut = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
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
          emailRedirectTo: `${location.origin}/auth/callback`,
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

  const value = {
    user,
    isLoading,
    signOut,
    signInWithEmail,
    signUpWithEmail,
  }

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useSupabaseAuth = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider')
  }
  return context
} 