'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@/lib/supabase/client'

interface SupabaseContext {
  supabase: SupabaseClient
}

const Context = React.createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [supabase] = React.useState(() => createClient())

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