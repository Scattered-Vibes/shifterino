import { Suspense } from 'react'
import RequirementsTable from './_components/requirements-table'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Loading } from '@/components/ui/loading'

export default async function RequirementsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Staffing Requirements</h1>
      </div>

      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <RequirementsTable />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
