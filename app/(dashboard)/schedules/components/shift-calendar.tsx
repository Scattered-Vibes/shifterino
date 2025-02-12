'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { addDays, format, startOfWeek } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/lib/supabase/client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/index'

type IndividualShift = Tables['individual_shifts']['Row']
type Employee = Tables['employees']['Row']

interface ShiftCalendarProps {
  employeeId?: string
  onShiftClick?: (shift: IndividualShift) => void
}

export function ShiftCalendar({ employeeId, onShiftClick }: ShiftCalendarProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [view, setView] = useState<'day' | 'week'>('week')
  const supabase = createClient()

  const startDate = view === 'week' ? startOfWeek(date) : date
  const endDate = view === 'week' ? addDays(startDate, 6) : date

  const { data: shifts } = useQuery({
    queryKey: ['shifts', employeeId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('individual_shifts')
        .select(`
          *,
          employee:employees(*),
          shift_option:shift_options(*)
        `)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      if (employeeId) {
        query = query.eq('employee_id', employeeId)
      }

      const { data, error } = await query
      if (error) throw error
      return data as (IndividualShift & {
        employee: Employee
        shift_option: {
          start_time: string
          end_time: string
          name: string
        }
      })[]
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[240px] justify-start text-left font-normal',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select value={view} onValueChange={(value) => setView(value as 'day' | 'week')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day View</SelectItem>
              <SelectItem value="week">Week View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {shifts?.map((shift) => (
          <div
            key={shift.id}
            className="rounded-lg border p-4 hover:bg-accent cursor-pointer"
            onClick={() => onShiftClick?.(shift)}
          >
            <div className="font-semibold">
              {shift.employee.first_name} {shift.employee.last_name}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(`${shift.date}T${shift.shift_option.start_time}`), 'h:mm a')} - 
              {format(new Date(`${shift.date}T${shift.shift_option.end_time}`), 'h:mm a')}
            </div>
            <div className="text-sm">{shift.shift_option.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
} 