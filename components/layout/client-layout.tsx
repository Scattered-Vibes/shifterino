'use client'

import { Sidebar } from '@/components/ui/sidebar'
import { Header } from '@/components/ui/header'
import type { EmployeeRole } from '@/types/employee'

interface ClientLayoutProps {
  user: {
    email?: string | undefined
  }
  employee: {
    id: string
    first_name: string
    last_name: string
    role: EmployeeRole
  }
  children: React.ReactNode
}

export function ClientLayout({ user, employee, children }: ClientLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} employee={employee} />
      <div className="flex flex-1">
        <Sidebar userRole={employee.role} />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
} 