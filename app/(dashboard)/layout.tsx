import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { createClient } from '@/lib/supabase/server'
import { SideNav } from '@/components/ui/side-nav'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { UserNav } from '@/components/ui/user-nav'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import type { EmployeeRole } from '@/types/database'

export const metadata: Metadata = {
  title: '911 Dispatch Scheduler - Dashboard',
  description: 'Manage your dispatch center schedules efficiently',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get the employee record with role
  const { data: employee, error } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (error) {
    throw new Error('Failed to fetch employee data')
  }

  if (!employee) {
    redirect('/complete-profile')
  }

  const role = employee.role as EmployeeRole

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b bg-card px-6">
        <div className="text-lg font-semibold">911 Dispatch Scheduler</div>
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-4 w-4"><LoadingSpinner size="sm" /></div>}>
            <ThemeToggle />
          </Suspense>
          <Suspense fallback={<div className="h-4 w-4"><LoadingSpinner size="sm" /></div>}>
            <UserNav />
          </Suspense>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <ErrorBoundary>
          <Suspense fallback={<div className="m-4"><LoadingSpinner size="lg" /></div>}>
            <SideNav role={role} />
          </Suspense>
        </ErrorBoundary>
        <main className="flex-1 overflow-auto p-4">
          <ErrorBoundary>
            <Suspense fallback={<div className="m-4"><LoadingSpinner size="lg" /></div>}>
              {children}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
