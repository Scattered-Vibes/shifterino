import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth/server'
import { StaffingOverview } from './components/staffing-overview'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Loading } from '@/components/ui/loading'

export default async function OverviewPage() {
  await requireAuth()

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Staffing Overview</h1>
      
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <StaffingOverview />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
