'use client'

import { MainNav } from '@/components/ui/main-nav'
import { UserNav } from '@/components/ui/user-nav'
import { SidebarNav } from '@/components/ui/sidebar-nav'
import type { UserRole } from '@/types/models/employee'

interface DashboardClientLayoutProps {
  children: React.ReactNode
  userRole: UserRole
  firstName: string
  lastName: string
  email: string
}

export function DashboardClientLayout({
  children,
  userRole,
  firstName,
  lastName,
  email
}: DashboardClientLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-background lg:block">
        <div className="flex h-full flex-col">
          <div className="p-6">
            <h2 className="text-lg font-semibold">911 Dispatch</h2>
          </div>
          <SidebarNav className="flex-1 px-4" userRole={userRole} />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-6">
          <MainNav userRole={userRole} />
          <UserNav 
            name={`${firstName} ${lastName}`}
            email={email}
            role={userRole}
          />
        </header>
        <main className="flex-1">
          <div className="container py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 