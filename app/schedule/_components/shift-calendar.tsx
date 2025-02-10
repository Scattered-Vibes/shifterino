'use client'

import { useEffect, useRef } from 'react'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { ShiftEvent } from '@/types/shift'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ShiftCalendarProps {
  events: ShiftEvent[]
  isLoading: boolean
  onEventClick: (event: ShiftEvent) => void
}

export function ShiftCalendar({ events, isLoading, onEventClick }: ShiftCalendarProps) {
  const calendarRef = useRef<HTMLDivElement>(null)
  const calendarInstanceRef = useRef<Calendar | null>(null)

  useEffect(() => {
    if (!calendarRef.current) return

    const calendar = new Calendar(calendarRef.current, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'timeGridWeek',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      slotMinTime: '00:00:00',
      slotMaxTime: '24:00:00',
      allDaySlot: false,
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      weekends: true,
      nowIndicator: true,
      events: events.map(event => ({
        ...event,
        title: `Employee ${event.title}`,
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb'
      })),
      eventClick: (info) => {
        const event = events.find(e => e.id === info.event.id)
        if (event) {
          onEventClick(event)
        }
      }
    })

    calendar.render()
    calendarInstanceRef.current = calendar

    return () => {
      calendar.destroy()
      calendarInstanceRef.current = null
    }
  }, [events, onEventClick])

  if (isLoading) {
    return (
      <Card className="flex h-[600px] items-center justify-center">
        <LoadingSpinner />
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div ref={calendarRef} className="h-[600px]" />
    </Card>
  )
} 