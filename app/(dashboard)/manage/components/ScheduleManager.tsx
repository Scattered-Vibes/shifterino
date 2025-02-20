'use client'

import { FC } from 'react'
import { EventDropArg } from '@fullcalendar/core'
import { EventResizeStopArg } from '@fullcalendar/interaction'
import { ShiftCalendar } from '@/components/ui/calendar'
import { useShifts, useUpdateShift, useDeleteShift } from '@/lib/hooks/client/use-shifts'
import type { ShiftEvent } from '@/types/scheduling/shift'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { toast } from '@/components/ui/use-toast'
import { getUserFriendlyMessage, ErrorCode } from '@/lib/utils/error-handler'

interface ScheduleManagerProps {
  shifts: ShiftEvent[]
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
  const { events, isLoading, error } = useShifts()
  const { updateShift, isLoading: isUpdatingShift } = useUpdateShift()
  const { deleteShift, isLoading: isDeletingShift } = useDeleteShift()

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
      await updateShift({
        shiftId: event.id,
        data: {
          date: event.start.toISOString(),
          shift_option_id: event.extendedProps.shiftOptionId
        }
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
      await updateShift({
        shiftId: event.id,
        data: {
          date: event.start.toISOString(),
          shift_option_id: event.extendedProps.shiftOptionId
        }
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
