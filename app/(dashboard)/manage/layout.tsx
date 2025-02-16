import { requireAuth } from '@/lib/auth/server'
import { ClientManageLayout } from './client-layout'

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()
  return <ClientManageLayout userRole={user.role}>{children}</ClientManageLayout>
} 