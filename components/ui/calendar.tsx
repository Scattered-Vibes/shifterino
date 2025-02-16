'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, DayPickerSingleProps } from 'react-day-picker'
import { format } from 'date-fns'

import { cn } from '@/lib/utils/index'
import { buttonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import type { Schedule } from '@/types/scheduling/schedule'

export type CalendarProps = Omit<DayPickerSingleProps, 'mode' | 'onSelect'> & {
  schedule?: Schedule[]
  onShiftClick?: (shift: Schedule) => void
  onDateSelect?: (date: Date) => void
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  schedule = [],
  onShiftClick,
  onDateSelect,
  ...props
}: CalendarProps) {
  const [isWeekView, setIsWeekView] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()

  const handleShiftClick = (shift: Schedule) => {
    onShiftClick?.(shift)
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      onDateSelect?.(date)
    }
  }

  const getShiftConflicts = (shifts: Schedule[]) => {
    const conflicts = new Set<string>()
    shifts.forEach((shift1, i) => {
      shifts.slice(i + 1).forEach(shift2 => {
        if (shift1.employeeId === shift2.employeeId) {
          const time1 = new Date(shift1.date).getTime()
          const time2 = new Date(shift2.date).getTime()
          if (Math.abs(time1 - time2) < 4 * 60 * 60 * 1000) { // 4 hours
            conflicts.add(shift1.id)
            conflicts.add(shift2.id)
          }
        }
      })
    })
    return conflicts
  }

  const conflicts = getShiftConflicts(schedule)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setIsWeekView(!isWeekView)}
          data-testid="calendar-view-type"
        >
          {isWeekView ? 'Month View' : 'Week View'}
        </Button>
      </div>

      <div data-testid="calendar-grid">
        <DayPicker
          showOutsideDays={showOutsideDays}
          className={cn('p-3', className)}
          classNames={{
            months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
            month: 'space-y-4',
            caption: 'flex justify-center pt-1 relative items-center',
            caption_label: 'text-sm font-medium',
            nav: 'space-x-1 flex items-center',
            nav_button: cn(
              buttonVariants({ variant: 'outline' }),
              'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
            ),
            nav_button_previous: 'absolute left-1',
            nav_button_next: 'absolute right-1',
            table: 'w-full border-collapse space-y-1',
            head_row: 'flex',
            head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
            row: 'flex w-full mt-2',
            cell: cn(
              'relative h-9 w-9 text-center text-sm p-0',
              '[&:has([aria-selected])]:bg-accent',
              'first:[&:has([aria-selected])]:rounded-l-md',
              'last:[&:has([aria-selected])]:rounded-r-md',
              'focus-within:relative focus-within:z-20'
            ),
            day: cn(
              buttonVariants({ variant: 'ghost' }),
              'h-9 w-9 p-0 font-normal aria-selected:opacity-100'
            ),
            day_selected: 'bg-primary text-primary-foreground',
            day_today: 'bg-accent text-accent-foreground',
            day_outside: 'text-muted-foreground opacity-50',
            day_disabled: 'text-muted-foreground opacity-50',
            day_hidden: 'invisible',
            ...classNames,
          }}
          components={{
            IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
            IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
          }}
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          numberOfMonths={isWeekView ? 1 : undefined}
          weekStartsOn={0}
          {...props}
        />

        {schedule.map((shift) => (
          <div
            key={shift.id}
            data-testid={`shift-${shift.id}`}
            className={cn(
              'absolute px-2 py-1 text-xs rounded',
              `status-${shift.status}`,
              conflicts.has(shift.id) && 'conflict'
            )}
            style={{
              top: `${new Date(shift.date).getHours() * 4}%`,
              left: `${new Date(shift.date).getDay() * (100 / 7)}%`
            }}
            onClick={() => handleShiftClick(shift)}
          >
            {format(new Date(shift.date), 'h:mm a')}
          </div>
        ))}
      </div>
    </div>
  )
}

Calendar.displayName = 'Calendar'

export { Calendar }
