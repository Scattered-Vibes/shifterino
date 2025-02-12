'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './theme-provider'
import SupabaseProvider from './supabase-provider'
import { Toaster } from '@/components/ui/toaster'
import type { Session } from '@supabase/supabase-js'
import { useState } from 'react'

interface ProvidersProps {
  children: React.ReactNode
  session: Session | null
}

export function Providers({ children, session }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SupabaseProvider session={session}>
          {children}
          <Toaster />
        </SupabaseProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
} 