'use client'

import { useEffect, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/use-toast'
import type { EventInput, EventDropArg, EventResizeDoneArg } from '@fullcalendar/core'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface ShiftEvent extends EventInput {
  id: string
  employeeId: string
  title: string
  start: string
  end: string
  backgroundColor?: string
  extendedProps: {
    shiftType: string
    isOvertime: boolean
  }
}

export function ScheduleManager() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [events, setEvents] = useState<ShiftEvent[]>([])

  // Fetch shifts using React Query
  const { data: shifts } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('individual_shifts')
        .select(`
          id,
          employee:employees(id, first_name, last_name),
          start_time,
          end_time,
          shift_type,
          is_overtime
        `)
      
      if (error) throw error
      
      return data.map(shift => ({
        id: shift.id,
        employeeId: shift.employee.id,
        title: `${shift.employee.first_name} ${shift.employee.last_name}`,
        start: shift.start_time,
        end: shift.end_time,
        backgroundColor: shift.is_overtime ? '#FFA500' : '#4CAF50',
        extendedProps: {
          shiftType: shift.shift_type,
          isOvertime: shift.is_overtime
        }
      }))
    }
  })

  useEffect(() => {
    if (shifts) {
      setEvents(shifts)
    }
  }, [shifts])

  // Set up real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('shifts')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'individual_shifts' 
        }, 
        (payload) => {
          queryClient.invalidateQueries(['shifts'])
          toast({
            title: 'Schedule Updated',
            description: 'The schedule has been updated.'
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, supabase])

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    try {
      const { event } = dropInfo
      const { data, error } = await supabase
        .from('individual_shifts')
        .update({
          start_time: event.start,
          end_time: event.end
        })
        .eq('id', event.id)

      if (error) throw error

      toast({
        title: 'Shift Updated',
        description: 'The shift has been successfully moved.'
      })
    } catch (error) {
      console.error('Failed to update shift:', error)
      toast({
        title: 'Error',
        description: 'Failed to update shift. Please try again.',
        variant: 'destructive'
      })
      dropInfo.revert()
    }
  }

  const handleEventResize = async (resizeInfo: EventResizeDoneArg) => {
    try {
      const { event } = resizeInfo
      const { data, error } = await supabase
        .from('individual_shifts')
        .update({
          end_time: event.end
        })
        .eq('id', event.id)

      if (error) throw error

      toast({
        title: 'Shift Updated',
        description: 'The shift duration has been updated.'
      })
    } catch (error) {
      console.error('Failed to resize shift:', error)
      toast({
        title: 'Error',
        description: 'Failed to update shift duration. Please try again.',
        variant: 'destructive'
      })
      resizeInfo.revert()
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-[600px]">
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          editable={true}
          droppable={true}
          events={events}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          nowIndicator={true}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay'
          }}
        />
      </div>
    </DndProvider>
  )
}