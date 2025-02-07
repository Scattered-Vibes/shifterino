'use client'

import { useEffect } from 'react'
import type {
  EventDropArg,
  EventInput,
} from '@fullcalendar/core'
import type { EventResizeStopArg } from '@fullcalendar/interaction'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/use-toast'
import type { Database } from '@/types/database'

interface ShiftEvent extends EventInput {
  id: string
  employeeId: string
  title: string
  start: string
  end: string
  backgroundColor: string
  extendedProps: {
    shiftOptionId: string
    isOvertime: boolean
    isRegularSchedule: boolean
    status: Database['public']['Enums']['shift_status']
  }
}

const fetchShifts = async (): Promise<ShiftEvent[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('individual_shifts')
    .select(`
      id,
      employee_id,
      date,
      shift_option_id,
      is_overtime,
      is_regular_schedule,
      status,
      shift_options!shift_option_id (
        start_time,
        end_time,
        name
      ),
      employees!employee_id (
        first_name,
        last_name
      )
    `)

  if (error) {
    console.error('Error fetching shifts:', error)
    return []
  }

  return data?.map((shift) => ({
    id: shift.id,
    employeeId: shift.employee_id,
    title: `${shift.employees.first_name} ${shift.employees.last_name}`,
    start: `${shift.date}T${shift.shift_options.start_time}`,
    end: `${shift.date}T${shift.shift_options.end_time}`,
    backgroundColor: shift.is_overtime ? '#fca5a5' : '#93c5fd',
    extendedProps: {
      shiftOptionId: shift.shift_option_id,
      isOvertime: shift.is_overtime,
      isRegularSchedule: shift.is_regular_schedule,
      status: shift.status
    }
  })) || []
}

export function ScheduleManager() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: fetchShifts,
  })

  useEffect(() => {
    const channel = supabase
      .channel('shifts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'individual_shifts',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['shifts'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, supabase])

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const { event } = dropInfo
    const supabase = createClient()

    if (!event.start) return

    try {
      const { error } = await supabase
        .from('individual_shifts')
        .update({
          date: event.start.toISOString().split('T')[0] as string,
        })
        .eq('id', event.id)

      if (error) throw error

      toast({
        title: 'Shift updated',
        description: 'The shift has been successfully moved.',
      })

      queryClient.invalidateQueries({ queryKey: ['shifts'] })
    } catch (error) {
      console.error('Error updating shift:', error)
      toast({
        title: 'Error',
        description: 'Failed to update shift. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleEventResize = async (resizeInfo: EventResizeStopArg) => {
    const { event } = resizeInfo
    const supabase = createClient()

    if (!event.start) return

    try {
      const { error } = await supabase
        .from('individual_shifts')
        .update({
          date: event.start.toISOString().split('T')[0] as string,
        })
        .eq('id', event.id)

      if (error) throw error

      toast({
        title: 'Shift updated',
        description: 'The shift duration has been successfully updated.',
      })

      queryClient.invalidateQueries({ queryKey: ['shifts'] })
    } catch (error) {
      console.error('Error updating shift:', error)
      toast({
        title: 'Error',
        description: 'Failed to update shift duration. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-[calc(100vh-4rem)]">
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          editable={true}
          droppable={true}
          events={shifts}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          nowIndicator={true}
          height="100%"
        />
      </div>
    </DndProvider>
  )
}
