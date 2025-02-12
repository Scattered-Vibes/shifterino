'use client'

import { useEffect, useRef, useMemo } from 'react'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { ShiftEvent } from '@/types/shift'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Badge } from '@/components/ui/badge'
import { calculateStaffingLevels } from '@/lib/utils/staffing'
import { validateShiftPattern } from '@/lib/utils/shift-patterns'
import { cn } from '@/lib/utils/index'

interface ShiftCalendarProps {
  events: ShiftEvent[]
  isLoading: boolean
  staffingRequirements: {
    minStaff: number
    supervisorRequired: boolean
    timeStart: string
    timeEnd: string
  }[]
  onEventClick: (event: ShiftEvent) => void
  onEventDrop?: (event: ShiftEvent, delta: Duration) => void
  onEventResize?: (event: ShiftEvent, delta: Duration) => void
}

export function ShiftCalendar({ 
  events, 
  isLoading, 
  staffingRequirements,
  onEventClick,
  onEventDrop,
  onEventResize 
}: ShiftCalendarProps) {
  const calendarRef = useRef<HTMLDivElement>(null)
  const calendarInstanceRef = useRef<Calendar | null>(null)

  // Calculate staffing levels for validation
  const staffingLevels = useMemo(() => 
    calculateStaffingLevels(events, staffingRequirements),
    [events, staffingRequirements]
  )

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
      eventContent: (arg) => {
        const event = events.find(e => e.id === arg.event.id)
        if (!event) return { html: '' }

        const isValid = validateShiftPattern(event, events)
        const isSupervisor = event.employeeRole === 'supervisor'

        return {
          html: `
            <div class="p-1">
              <div class="flex items-center gap-1">
                <span class="${cn(
                  'text-sm font-medium',
                  !isValid && 'text-destructive'
                )}">${event.title}</span>
                ${isSupervisor ? '<span class="text-xs bg-primary-foreground px-1 rounded">SUP</span>' : ''}
              </div>
              <div class="text-xs text-muted-foreground">
                ${arg.timeText}
              </div>
            </div>
          `
        }
      },
      eventDidMount: (info) => {
        const event = events.find(e => e.id === info.event.id)
        if (!event) return

        const isValid = validateShiftPattern(event, events)
        if (!isValid) {
          info.el.style.backgroundColor = 'rgb(239 68 68 / 0.2)' // red-500/20
          info.el.style.borderColor = 'rgb(239 68 68)' // red-500
        }
      },
      eventClick: (info) => {
        const event = events.find(e => e.id === info.event.id)
        if (event) {
          onEventClick(event)
        }
      },
      eventDrop: (info) => {
        const event = events.find(e => e.id === info.event.id)
        if (event && onEventDrop) {
          onEventDrop(event, info.delta)
        }
      },
      eventResize: (info) => {
        const event = events.find(e => e.id === info.event.id)
        if (event && onEventResize) {
          onEventResize(event, info.endDelta)
        }
      }
    })

    calendar.render()
    calendarInstanceRef.current = calendar

    return () => {
      calendar.destroy()
      calendarInstanceRef.current = null
    }
  }, [events, onEventClick, onEventDrop, onEventResize, staffingLevels])

  if (isLoading) {
    return (
      <Card className="flex h-[600px] items-center justify-center">
        <LoadingSpinner />
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex gap-2 mb-4">
        {staffingLevels.map((level, index) => (
          <Badge 
            key={index}
            variant={level.isMet ? "default" : "destructive"}
          >
            {level.timeRange}: {level.currentStaff}/{level.requiredStaff}
            {level.supervisorRequired && !level.hasSupervisor && " (No Supervisor)"}
          </Badge>
        ))}
      </div>
      <div ref={calendarRef} className="h-[600px]" />
    </Card>
  )
} 