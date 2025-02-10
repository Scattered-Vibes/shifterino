'use client'

import { FC } from 'react'
import { EventDropArg } from '@fullcalendar/core'
import { EventResizeStopArg } from '@fullcalendar/interaction'
import { ShiftCalendar } from '@/components/calendar/ShiftCalendar'
import { useShifts } from '@/lib/hooks/use-shifts'
import type { Shift } from '@/types/shift'
import { ErrorBoundary } from '@/components/error-boundary'
import { toast } from '@/components/ui/use-toast'
import { getUserFriendlyMessage, ErrorCode } from '@/lib/utils/error-handler'

interface ScheduleManagerProps {
  shifts: Shift[]
}

const ErrorFallback: FC<{ error: Error }> = ({ error }) => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-lg bg-destructive/10 p-6 text-center">
        <h3 className="mb-2 text-lg font-semibold">Schedule Display Error</h3>
        <p className="text-muted-foreground">
          {getUserFriendlyMessage(ErrorCode.SCHEDULE_UPDATE_FAILED)}
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="mt-2 text-sm text-destructive">{error.message}</p>
        )}
      </div>
    </div>
  )
}

export const ScheduleManager: FC<ScheduleManagerProps> = ({ shifts: _shifts }) => {
  const { events, updateShift, isLoading, error } = useShifts()

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-muted-foreground">Loading schedule...</div>
      </div>
    )
  }

  if (error) {
    return <ErrorFallback error={error} />
  }

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const { event } = dropInfo

    if (!event.start || !event.end) {
      toast({
        title: 'Invalid Time Selection',
        description: getUserFriendlyMessage(ErrorCode.SCHEDULE_INVALID_TIME),
        variant: 'destructive'
      })
      return
    }

    try {
      await updateShift(event.id, {
        actual_start_time: event.start.toISOString(),
        actual_end_time: event.end.toISOString(),
        shift_option_id: event.extendedProps.shiftOptionId,
        actual_hours_worked: (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60)
      })
    } catch (error) {
      // Error is already handled in useShifts hook
      console.error('Event drop error:', error)
    }
  }

  const handleEventResize = async (resizeInfo: EventResizeStopArg) => {
    const { event } = resizeInfo

    if (!event.start || !event.end) {
      toast({
        title: 'Invalid Time Selection',
        description: getUserFriendlyMessage(ErrorCode.SCHEDULE_INVALID_TIME),
        variant: 'destructive'
      })
      return
    }

    try {
      await updateShift(event.id, {
        actual_start_time: event.start.toISOString(),
        actual_end_time: event.end.toISOString(),
        shift_option_id: event.extendedProps.shiftOptionId,
        actual_hours_worked: (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60)
      })
    } catch (error) {
      // Error is already handled in useShifts hook
      console.error('Event resize error:', error)
    }
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="h-full w-full">
        <ShiftCalendar
          events={events}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
        />
      </div>
    </ErrorBoundary>
  )
}
