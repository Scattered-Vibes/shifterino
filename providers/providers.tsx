'use client'

import * as React from 'react'
import { ThemeProvider } from './theme-provider'
import { ToastProvider } from './toast-provider'
import { SupabaseProvider } from './supabase-provider'
import { AuthProvider } from './auth-provider'
import { ErrorBoundary } from './error-boundary'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary fallback={<div>Something went wrong. Please try again.</div>}>
      <ThemeProvider>
        <SupabaseProvider>
          <AuthProvider>
            {children}
            <ToastProvider />
          </AuthProvider>
        </SupabaseProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
} 