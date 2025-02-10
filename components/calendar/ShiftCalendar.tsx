'use client'

import { FC } from 'react'
import FullCalendar from '@fullcalendar/react'
import { EventDropArg } from '@fullcalendar/core'
import { EventResizeStopArg } from '@fullcalendar/interaction'
import type { ShiftEvent } from '@/types/shift'

interface ShiftCalendarProps {
  events: ShiftEvent[]
  onEventDrop: (dropInfo: EventDropArg) => Promise<void>
  onEventResize: (resizeInfo: EventResizeStopArg) => Promise<void>
}

export const ShiftCalendar: FC<ShiftCalendarProps> = ({
  events,
  onEventDrop,
  onEventResize
}) => {
  return (
    <div className="h-full w-full">
      <FullCalendar
        events={events}
        editable={true}
        eventDrop={onEventDrop}
        eventResize={onEventResize}
        // Add other FullCalendar props as needed
      />
    </div>
  )
} 