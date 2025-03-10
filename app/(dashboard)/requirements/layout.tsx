import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/server'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export default async function RequirementsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  // Only allow managers to access this route
  if (user.role !== 'manager') {
    redirect('/unauthorized')
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
} 