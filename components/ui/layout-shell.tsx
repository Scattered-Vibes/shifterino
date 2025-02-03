'use client'

import { Nav } from '@/components/ui/nav'
import type { EmployeeRole } from '@/app/_types/database'
import { signOut } from '@/app/actions'

interface LayoutShellProps {
  children: React.ReactNode
  role?: EmployeeRole
}

export function LayoutShell({ children, role }: LayoutShellProps) {
  return (
    <div className="flex flex-col h-screen">
      <header className="border-b bg-background z-10">
        <div className="flex h-16 items-center px-4 sm:px-6">
          <div className="flex-1">
            <h1 className="text-xl font-bold">Shifterino</h1>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-sm font-medium hover:text-accent-foreground">
              Sign Out
            </button>
          </form>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <Nav role={role} />
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
} 