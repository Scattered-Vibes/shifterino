'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { useSupabase } from './supabase-provider'
import { toast } from 'sonner'
import { Loading } from '@/components/ui/loading'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: Error | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const { supabase } = useSupabase()
  const [state, setState] = useState<AuthContextType>({
    user: null,
    isLoading: true,
    error: null
  })
  const router = useRouter()

  useEffect(() => {
    // Check active session
    supabase.auth.getUser()
      .then(({ data: { user }, error }) => {
        if (error) throw error
        setState(prev => ({ ...prev, user, isLoading: false }))
      })
      .catch(error => {
        setState(prev => ({ ...prev, error, isLoading: false }))
        toast.error('Authentication error: ' + error.message)
      })

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setState(prev => ({ ...prev, user: session?.user ?? null }))
      if (event === 'SIGNED_IN') {
        toast.success('Successfully signed in')
        router.refresh()
      }
      if (event === 'SIGNED_OUT') {
        toast.success('Successfully signed out')
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  if (state.error) {
    // Don't throw here, just show error state
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-4 text-red-500">
          Authentication Error: {state.error.message}
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={state}>
      {state.isLoading ? (
        <Loading size="lg" fullScreen />
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
} 