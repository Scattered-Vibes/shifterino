import { type ReactNode } from 'react'
import { requireAuth } from '@/lib/auth'
import type { Metadata } from 'next'
import { MainNav } from '@/components/ui/main-nav'
import { UserNav } from '@/components/ui/user-nav'
import { ThemeProvider } from '@/app/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'

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
      <div className="flex min-h-screen flex-col space-y-6">
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
        <main className="container flex-1">{children}</main>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
