import { type ReactNode } from 'react'
import { requireAuth } from '@/lib/auth/server'
import type { Metadata } from 'next'
import { MainNav } from '@/components/ui/main-nav'
import { UserNav } from '@/components/ui/user-nav'
import { SidebarNav } from '@/components/ui/sidebar-nav'
import { ThemeProvider } from '@/app/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { DashboardError } from '@/components/ui/errors'

export const metadata: Metadata = {
  title: '911 Dispatch Scheduler - Dashboard',
  description: 'Manage your dispatch center schedules efficiently',
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await requireAuth();
  
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ErrorBoundary fallback={<DashboardError title="Error" message="Something went wrong loading the dashboard" />}>
        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-40 border-b bg-background">
            <div className="container flex h-16 items-center justify-between py-4">
              <MainNav />
              <UserNav
                user={{
                  email: user.email,
                  role: user.role,
                }}
              />
            </div>
          </header>
          <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
            <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
              <div className="relative overflow-hidden py-6 pr-6 lg:py-8">
                <SidebarNav />
              </div>
            </aside>
            <main className="flex w-full flex-col overflow-hidden">{children}</main>
          </div>
        </div>
      </ErrorBoundary>
      <Toaster />
    </ThemeProvider>
  )
}
