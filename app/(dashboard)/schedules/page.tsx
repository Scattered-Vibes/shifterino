'use client'

import { Suspense } from 'react'
import { format } from 'date-fns'

import { useSchedules } from '@/lib/hooks/use-query'
import { Calendar } from '@/components/ui/calendar'
import { ErrorBoundary } from '@/components/error-boundary'

function ScheduleCalendar() {
  const { data: schedules } = useSchedules()

  return (
    <Calendar
      mode="multiple"
      selected={schedules?.map((schedule) => new Date(schedule.start_date))}
      className="rounded-md border"
    />
  )
}

export default function SchedulesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Schedules</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {format(new Date(), 'MMMM yyyy')}
          </p>
        </div>
      </div>

      <ErrorBoundary>
        <Suspense fallback={<div>Loading calendar...</div>}>
          <ScheduleCalendar />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
