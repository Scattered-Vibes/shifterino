'use client'

import type { Database } from '@/types/database'
import { Header } from '@/components/ui/header'
import { SideNav } from '@/components/ui/side-nav'

type EmployeeRole = Database['public']['Enums']['employee_role']

interface ClientLayoutProps {
  employee: {
    id: string
    first_name: string
    last_name: string
    role: EmployeeRole
  }
  children: React.ReactNode
}

export function ClientLayout({ employee, children }: ClientLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <SideNav role={employee.role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
