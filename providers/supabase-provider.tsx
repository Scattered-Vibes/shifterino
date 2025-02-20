'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState, createContext, useContext } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'
import { Loading } from '@/components/ui/loading'

interface SupabaseContextType {
  supabase: SupabaseClient<Database>
  isLoading: boolean
  error: Error | null
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

export function SupabaseProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [state, setState] = useState<SupabaseContextType>(() => ({
    supabase: createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    isLoading: true,
    error: null
  }))

  useEffect(() => {
    // Verify the connection
    state.supabase.auth.getSession()
      .then(() => setState(prev => ({ ...prev, isLoading: false })))
      .catch(error => setState(prev => ({ ...prev, error, isLoading: false })))
  }, [state.supabase])

  if (state.error) {
    throw state.error // This will be caught by the ErrorBoundary
  }

  return (
    <SupabaseContext.Provider value={state}>
      {state.isLoading ? (
        <Loading size="lg" fullScreen />
      ) : (
        children
      )}
    </SupabaseContext.Provider>
  )
} 