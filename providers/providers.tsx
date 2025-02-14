'use client'

import * as React from 'react'
import { ThemeProvider } from './theme-provider'
import { ToastProvider } from './toast-provider'
import { SupabaseProvider } from './supabase-provider'
import { AuthProvider } from './auth-provider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SupabaseProvider>
          {children}
          <ToastProvider />
        </SupabaseProvider>
      </AuthProvider>
    </ThemeProvider>
  )
} 