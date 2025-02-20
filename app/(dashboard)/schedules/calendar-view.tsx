'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/types/supabase/database'

type AssignedShift = Database['public']['Tables']['assigned_shifts']['Row'] & {
  employee: Database['public']['Tables']['employees']['Row']
  shift_option: Database['public']['Tables']['shift_options']['Row']
}

export interface CalendarViewProps {
  data: AssignedShift[]
}

function formatShiftTime(shift: AssignedShift) {
  return `${format(
    new Date(`2000-01-01T${shift.shift_option.start_time}`),
    'h:mm a'
  )} to ${format(new Date(`2000-01-01T${shift.shift_option.end_time}`), 'h:mm a')}`
}

function getStatusBadgeVariant(status: Database['public']['Enums']['shift_status']) {
  switch (status) {
    case 'completed':
      return 'default'
    case 'cancelled':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export function ScheduleCalendar({ data }: CalendarViewProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())

  // Filter shifts for the selected date
  const selectedDateShifts = data.filter((shift) => {
    const shiftDate = new Date(shift.date)
    const selectedDateValue = date

    if (!selectedDateValue) return false

    return (
      shiftDate.toDateString() === selectedDateValue.toDateString()
    )
  })

  // Get all dates with shifts for highlighting in calendar
  const datesWithShifts = data.reduce((dates, shift) => {
    const shiftDate = new Date(shift.date)
    dates.add(shiftDate.toDateString())
    return dates
  }, new Set<string>())

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            modifiers={{
              hasShifts: (date: Date) => datesWithShifts.has(date.toDateString()),
            }}
            modifiersStyles={{
              hasShifts: {
                backgroundColor: 'hsl(var(--primary) / 0.1)',
                borderRadius: '4px',
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Shifts for{' '}
            {date ? format(date, 'MMMM d, yyyy') : 'Selected Date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {selectedDateShifts.map((shift) => (
                <Card key={shift.id} className="mb-4">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Shift #{shift.id.slice(0, 8)}
                      </CardTitle>
                      <Badge variant={getStatusBadgeVariant(shift.status)}>
                        {shift.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium">Employee</h4>
                        <p className="text-sm text-muted-foreground">
                          {shift.employee?.first_name}{' '}
                          {shift.employee?.last_name}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">Shift Option</h4>
                        <p className="text-sm text-muted-foreground">
                          {shift.shift_option.name}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">Start Time</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(
                            new Date(`1970-01-01T${shift.shift_option.start_time}`),
                            'h:mm a'
                          )}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">End Time</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(
                            new Date(`1970-01-01T${shift.shift_option.end_time}`),
                            'h:mm a'
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {selectedDateShifts.length === 0 && (
                <div className="text-center text-muted-foreground">
                  No shifts found for this date.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}