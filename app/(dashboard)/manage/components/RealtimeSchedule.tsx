'use client'

import { useEffect } from 'react'

import type { Database } from '@/types/supabase/database'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/use-toast'

type Schedule = Database['public']['Tables']['schedules']['Row']

interface RealtimeScheduleProps {
  onScheduleUpdate: (schedule: Schedule) => void
}

export default function RealtimeSchedule({
  onScheduleUpdate,
}: RealtimeScheduleProps) {
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('schedule-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules',
        },
        (payload) => {
          console.log('Change received!', payload)
          toast({
            title: 'Schedule Updated',
            description: 'The schedule has been modified.',
          })
          // Type cast the payload to our Schedule type
          const schedule = payload.new as Schedule
          onScheduleUpdate(schedule)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onScheduleUpdate])

  return null // This is a non-visual component
}
