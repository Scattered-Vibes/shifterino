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
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[AuthProvider:${requestId}] Initializing`)
  
  const { supabase } = useSupabase()
  const [state, setState] = useState<AuthContextType>({
    user: null,
    isLoading: true,
    error: null
  })
  const router = useRouter()

  useEffect(() => {
    console.log(`[AuthProvider:${requestId}] Checking initial user state`)
    
    // Check active session
    supabase.auth.getUser()
      .then(({ data: { user }, error }) => {
        console.log(`[AuthProvider:${requestId}] User check result:`, {
          hasUser: !!user,
          userId: user?.id,
          error: error?.message
        })
        
        if (error) throw error
        setState(prev => ({ ...prev, user, isLoading: false }))
      })
      .catch(error => {
        console.error(`[AuthProvider:${requestId}] User check error:`, error)
        setState(prev => ({ ...prev, error, isLoading: false }))
        toast.error('Authentication error: ' + error.message)
      })

    // Listen for changes
    console.log(`[AuthProvider:${requestId}] Setting up auth state listener`)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AuthProvider:${requestId}] Auth state change:`, {
        event,
        hasSession: !!session,
        userId: session?.user?.id
      })
      
      setState(prev => ({ ...prev, user: session?.user ?? null }))
      
      if (event === 'SIGNED_IN') {
        console.log(`[AuthProvider:${requestId}] User signed in`)
        toast.success('Successfully signed in')
        router.refresh()
      }
      if (event === 'SIGNED_OUT') {
        console.log(`[AuthProvider:${requestId}] User signed out`)
        toast.success('Successfully signed out')
        router.refresh()
      }
    })

    return () => {
      console.log(`[AuthProvider:${requestId}] Cleaning up auth state listener`)
      subscription.unsubscribe()
    }
  }, [supabase, router, requestId])

  if (state.error) {
    console.error(`[AuthProvider:${requestId}] Rendering error state:`, state.error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-4 text-red-500">
          Authentication Error: {state.error.message}
        </div>
      </div>
    )
  }

  console.log(`[AuthProvider:${requestId}] Rendering:`, {
    isLoading: state.isLoading,
    hasUser: !!state.user
  })
  
  return (
    <AuthContext.Provider value={state}>
      {state.isLoading ? (
        <Loading size="lg" variant="fullscreen" />
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
} 