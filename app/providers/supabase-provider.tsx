'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { supabase, type SupabaseClient } from '@/lib/supabase/client'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'

interface SupabaseContextType {
  supabase: SupabaseClient
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new AppError(
      'useSupabase must be used within a SupabaseProvider',
      ErrorCode.INTERNAL_ERROR,
      500
    )
  }
  return context.supabase
}

interface SupabaseProviderProps {
  children: ReactNode
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  // Use the singleton instance directly - no need for useState
  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  )
} 