import { SideNav } from '@/components/ui/side-nav'
import { UserNav } from '@/components/ui/user-nav'
import { useAuth } from '@/components/providers/AuthProvider'

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <h1 className="text-xl font-bold">Shifterino</h1>
          <UserNav user={user} />
        </div>
      </header>
      <div className="flex flex-1">
        <SideNav />
        <main className="flex-1">
          <div className="container grid gap-12 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 