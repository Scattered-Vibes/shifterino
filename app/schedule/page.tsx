import { Suspense } from 'react'
import { ScheduleManager } from './_components/schedule-manager'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export const metadata = {
  title: 'Schedule Manager',
  description: 'Manage employee schedules and shifts',
}

export default function SchedulePage() {
  return (
    <div className="mx-auto container px-4 py-8">
      <div className="mb-8">
        <h1 className="tracking-tight font-bold text-3xl">Schedule Manager</h1>
        <p className="mt-2 text-muted-foreground">
          Manage employee schedules and shifts with real-time updates
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <ScheduleManager />
      </Suspense>
    </div>
  )
} 