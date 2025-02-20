import { requireAuth } from '@/lib/auth/server'
import { Suspense } from 'react'
import { OverviewContent } from './components/overview-content'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default async function OverviewPage() {
  const auth = await requireAuth()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Welcome, {auth.firstName}!
      </h1>
      
      <Suspense fallback={<LoadingSpinner />}>
        <OverviewContent userId={auth.userId} role={auth.role} />
      </Suspense>
    </div>
  )
}
