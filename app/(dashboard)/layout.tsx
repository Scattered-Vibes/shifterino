import { UserNav } from '@/components/ui/user-nav'
import { SidebarNav } from '@/components/ui/sidebar-nav'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { DashboardError } from '@/components/ui/errors'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ErrorBoundary 
      fallback={
        <DashboardError 
          title="Dashboard Error" 
          message="Something went wrong loading the dashboard" 
        />
      }
    >
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 hidden md:flex">
              <a className="mr-6 flex items-center space-x-2" href="/">
                <span className="hidden font-bold sm:inline-block">
                  Shifterino
                </span>
              </a>
              <nav className="flex items-center space-x-6 text-sm font-medium">
                <SidebarNav />
              </nav>
            </div>
            <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
              <UserNav user={{ email: '', role: 'dispatcher' }} />
            </div>
          </div>
        </header>
        <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
            <nav className="grid items-start px-4 py-6 lg:px-8">
              <SidebarNav />
            </nav>
          </aside>
          <main className="flex w-full flex-col overflow-hidden">{children}</main>
        </div>
      </div>
      <Toaster />
    </ErrorBoundary>
  )
}
