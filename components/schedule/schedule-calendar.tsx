'use client'

import { useEffect, useState } from 'react'

import { Calendar } from '@/components/ui/calendar'

interface ScheduleCalendarProps {
  employeeId: string // Used for fetching employee-specific shifts
}

export function ScheduleCalendar({ employeeId }: ScheduleCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [shifts, setShifts] = useState([
    {
      date: new Date(),
      startTime: '05:00',
      endTime: '15:00',
      type: 'pattern_a',
    },
  ])

  useEffect(() => {
    // Mock shift fetching
    const fetchShifts = async () => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setShifts([
        {
          date: new Date(),
          startTime: '05:00',
          endTime: '15:00',
          type: 'pattern_a',
        },
        {
          date: new Date(Date.now() + 86400000), // Tomorrow
          startTime: '05:00',
          endTime: '15:00',
          type: 'pattern_a',
        },
      ])
    }

    fetchShifts()
  }, [employeeId])

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-md border"
      modifiers={{
        shift: shifts.map((shift) => shift.date),
      }}
      modifiersStyles={{
        shift: {
          fontWeight: 'bold',
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
        },
      }}
    />
  )
}
