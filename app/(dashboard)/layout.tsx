// app/(dashboard)/layout.tsx (should be correct already)
import { requireAuth } from '@/lib/auth/server'
import { DashboardClientLayout } from './DashboardClientLayout'
import type { UserRole } from '@/types/models/employee'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = await requireAuth()
  
  return (
    <DashboardClientLayout 
      userRole={auth.role as UserRole}
      firstName={auth.firstName}
      lastName={auth.lastName}
      email={auth.email}
    >
      {children}
    </DashboardClientLayout>
  )
}