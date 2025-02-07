'use client'

import { User } from '@supabase/supabase-js'

import { QueryProvider } from '@/lib/providers/query-provider'
import { TooltipProvider } from '@/components/ui/tooltip'

import { AuthProvider } from './AuthProvider'

export function RootProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser: User | null
}) {
  return (
    <QueryProvider>
      <AuthProvider initialUser={initialUser}>
        <TooltipProvider>{children}</TooltipProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
