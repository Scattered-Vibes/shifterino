'use client'

import * as React from 'react'
import { ThemeProvider } from './theme-provider'
import { ToastProvider } from './toast-provider'
import { SupabaseProvider } from './supabase-provider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <SupabaseProvider>
        {children}
        <ToastProvider />
      </SupabaseProvider>
    </ThemeProvider>
  )
} 