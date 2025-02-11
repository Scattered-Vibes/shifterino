import { requireAuth } from '@/app/lib/auth'
import type { Metadata } from 'next'
import { MainNav } from '@/components/ui/main-nav'
import { UserNav } from '@/components/ui/user-nav'
import { SidebarNav } from '@/components/ui/sidebar-nav'
import { ThemeProvider } from '@/app/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: '911 Dispatch Scheduler - Dashboard',
  description: 'Manage your dispatch center schedules efficiently',
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await requireAuth();
  
  const userInfo = {
    email: user.email,
    role: user.role
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <MainNav />
            <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
              <div className="w-full flex-1 md:w-auto md:flex-none">
                {/* Add search here if needed */}
              </div>
              <UserNav user={userInfo} />
            </div>
          </div>
        </header>

        <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
          <aside className="hidden w-[200px] flex-col md:flex">
            <SidebarNav userRole={userInfo.role} />
          </aside>
          <main className="flex w-full flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
