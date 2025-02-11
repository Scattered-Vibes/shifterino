import { getUser } from '@/app/lib/auth'
import { ClientManageLayout } from './client-layout'

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  const userRole = user?.role?.toUpperCase() || 'DISPATCHER'
  
  return <ClientManageLayout userRole={userRole}>{children}</ClientManageLayout>
} 