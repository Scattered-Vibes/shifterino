import { MainNav } from '@/components/dashboard/main-nav'
import { UserNav } from '@/components/dashboard/user-nav'

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav />
          <UserNav />
        </div>
      </header>
      <main className="flex-1">
        <div className="container grid gap-12 py-8">
          {children}
        </div>
      </main>
    </div>
  )
} 