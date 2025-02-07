'use client'

import { MainNav } from '@/components/ui/main-nav'
import { UserNav } from '@/components/ui/user-nav'
import { useAuth } from '@/components/providers/AuthProvider'

interface LayoutShellProps {
  children: React.ReactNode
}

export function LayoutShell({ children }: LayoutShellProps) {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col space-y-6">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav />
          {user && <UserNav />}
        </div>
      </header>
      <main className="container flex-1">{children}</main>
    </div>
  )
}
