'use client'

import React from 'react'
import { useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
  subMonths,
} from 'date-fns'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import type { Schedule } from '@/types/scheduling/schedule'
import { cn } from '@/lib/utils/index'
import { Button } from '@/components/ui/button'

interface CalendarProps {
  schedule: Schedule[]
  onShiftClick: (shift: Schedule) => void
  onDateSelect: (date: Date) => void
  className?: string
}

type ViewType = 'month' | 'week'

export function Calendar({
  schedule,
  onShiftClick,
  onDateSelect,
  className,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState<ViewType>('month')

  // Get days to display
  const start = startOfMonth(currentDate)
  const end = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start, end })

  // Group shifts by date
  const shiftsByDate = schedule.reduce(
    (acc, shift) => {
      const date = new Date(shift.date).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(shift)
      return acc
    },
    {} as Record<string, Schedule[]>
  )

  // Check for conflicts
  const hasConflict = (shift: Schedule): boolean => {
    const date = new Date(shift.date).toISOString().split('T')[0]
    const dayShifts = shiftsByDate[date] || []

    return dayShifts.some(
      (other: Schedule) =>
        other.id !== shift.id &&
        other.employeeId === shift.employeeId &&
        Math.abs(
          new Date(other.date).getTime() - new Date(shift.date).getTime()
        ) < 3600000 // 1 hour
    )
  }

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const toggleView = () => {
    setViewType(viewType === 'month' ? 'week' : 'month')
  }

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleView}
          aria-label={`Switch to ${viewType === 'month' ? 'week' : 'month'} view`}
        >
          {viewType === 'month' ? 'Week View' : 'Month View'}
          <CalendarIcon className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div
        role="grid"
        aria-label="Calendar"
        className="rounded-lg border bg-card text-card-foreground shadow-sm"
      >
        {/* Weekday Headers */}
        <div
          role="row"
          className="grid grid-cols-7 border-b bg-muted/50 text-muted-foreground"
        >
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              role="columnheader"
              className="px-3 py-2 text-center text-sm font-medium"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayShifts = shiftsByDate[dateKey] || []
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={dateKey}
                role="gridcell"
                aria-selected={isToday}
                data-testid={`calendar-cell-${dateKey}`}
                className={cn(
                  'min-h-[100px] cursor-pointer border p-2 transition-colors hover:bg-accent/50',
                  isToday && 'bg-accent'
                )}
                onClick={() => onDateSelect(day)}
              >
                <div className="mb-1 text-sm font-medium">
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayShifts.map((shift: Schedule) => (
                    <button
                      key={shift.id}
                      type="button"
                      data-testid={`shift-${shift.id}`}
                      className={cn(
                        'w-full rounded px-2 py-1 text-left text-xs transition-colors',
                        'bg-primary/10 hover:bg-primary/20',
                        hasConflict(shift) &&
                          'bg-destructive/10 hover:bg-destructive/20'
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onShiftClick(shift)
                      }}
                    >
                      {format(new Date(shift.date), 'h:mm a')}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

Calendar.displayName = 'Calendar'
