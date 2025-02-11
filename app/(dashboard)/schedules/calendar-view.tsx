'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ViewOptions } from './view-options'
import type { Database } from '@/types/supabase/database'

type ScheduleWithDetails = Database['public']['Tables']['individual_shifts']['Row'] & {
  employee: Database['public']['Tables']['employees']['Row']
  shift_option: Database['public']['Tables']['shift_options']['Row']
}

interface CalendarViewProps {
  promise: Promise<ScheduleWithDetails[]>
}

export async function ScheduleCalendar({ promise }: CalendarViewProps) {
  const shifts = await promise
  return <CalendarView shifts={shifts} />
}

function CalendarView({ shifts }: { shifts: ScheduleWithDetails[] }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedShift, setSelectedShift] = useState<ScheduleWithDetails | null>(null)

  // Group shifts by date
  const shiftsByDate = shifts.reduce((acc, shift) => {
    const date = shift.date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(shift)
    return acc
  }, {} as Record<string, ScheduleWithDetails[]>)

  // Custom day content renderer
  function DayContent({ date }: { date: Date }) {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayShifts = shiftsByDate[dateStr] || []

    return (
      <div className="w-full p-2 space-y-1">
        <time dateTime={dateStr} className="text-sm">
          {format(date, 'd')}
        </time>
        {dayShifts.map((shift) => (
          <Button
            key={shift.id}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs p-1"
            onClick={() => setSelectedShift(shift)}
          >
            <Badge
              variant={shift.shift_option.type === 'supervisor' ? 'default' : 'secondary'}
              className="w-full truncate"
            >
              {shift.employee.first_name} {shift.employee.last_name}
            </Badge>
          </Button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ViewOptions />
      
      <Card className="p-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border"
          components={{
            DayContent,
          }}
        />
      </Card>

      <Dialog open={!!selectedShift} onOpenChange={() => setSelectedShift(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shift Details</DialogTitle>
            <DialogDescription>
              {selectedShift && (
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Employee</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedShift.employee.first_name}{' '}
                        {selectedShift.employee.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Shift Type</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedShift.shift_option.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Start Time</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(`${selectedShift.date}T${selectedShift.start_time}`), 'h:mm a')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">End Time</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(`${selectedShift.date}T${selectedShift.end_time}`), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
} 