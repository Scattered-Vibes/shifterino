import { getAuthenticatedUser } from '@/lib/auth'
import { ClientManageLayout } from './client-layout'

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthenticatedUser()
  const userRole = user?.role?.toUpperCase() || 'DISPATCHER'
  
  return <ClientManageLayout userRole={userRole}>{children}</ClientManageLayout>
} 