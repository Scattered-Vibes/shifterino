import { getUser } from '@/lib/auth'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { MainNav } from '@/components/ui/main-nav'
import { UserNav } from '@/components/ui/user-nav'
import { SidebarNav } from '@/components/ui/sidebar-nav'

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
  const user = await getUser();
  
  if (!user || !user.email || !user.role) {
    redirect('/login');
  }

  const userInfo = {
    email: user.email,
    role: user.role
  };

  return (
    <div className="flex min-h-screen flex-col space-y-6">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav />
          <UserNav user={userInfo} />
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
  );
}
