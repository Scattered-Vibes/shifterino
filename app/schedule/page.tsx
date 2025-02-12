import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ScheduleManager } from './_components/schedule-manager'

export default async function SchedulePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-4xl font-bold">Schedule Management</h1>
      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <ScheduleManager />
      </Suspense>
    </div>
  )
} 