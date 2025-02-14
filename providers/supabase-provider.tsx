'use client'

import * as React from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { type Database } from '@/types/supabase'

interface SupabaseContext {
  supabase: ReturnType<typeof createBrowserClient<Database>>
}

const Context = React.createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [supabase] = React.useState(() => 
    createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  )
}

export function useSupabase() {
  const context = React.useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
} 