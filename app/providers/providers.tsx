'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { SupabaseProvider } from './supabase-provider'
import { AuthProvider } from './auth-provider'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      networkMode: 'always'
    },
    mutations: {
      networkMode: 'always'
    }
  }
})

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}