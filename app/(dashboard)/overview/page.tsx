import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAuth } from '@/lib/auth/server'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { DashboardError } from '@/components/ui/errors'
import DashboardLoading from '../loading'

export default async function OverviewPage() {
  const user = await requireAuth()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
      </div>
      <ErrorBoundary fallback={<DashboardError title="Error" message="Failed to load overview" />}>
        <Suspense fallback={<DashboardLoading />}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Welcome back, {user.email}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Dispatcher Dashboard</div>
                <p className="text-xs text-muted-foreground">
                  Manage your schedule and time off requests
                </p>
              </CardContent>
            </Card>
          </div>
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
