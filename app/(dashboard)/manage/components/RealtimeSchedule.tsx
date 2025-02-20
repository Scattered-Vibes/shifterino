'use client'

import { useEffect, useCallback, useState } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from '@/components/ui/use-toast'
import { RealtimeErrorBoundary } from './RealtimeErrorBoundary'
import { RealtimeLoadingState } from './RealtimeLoadingState'

type Schedule = Database['public']['Tables']['schedules']['Row']
type SchedulePayload = RealtimePostgresChangesPayload<{
  [key: string]: any
}>

type SubscriptionStatus = 'CONNECTING' | 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR'

interface RealtimeScheduleProps {
  onScheduleUpdate: (schedule: Schedule) => void
}

function RealtimeScheduleInner({
  onScheduleUpdate,
}: RealtimeScheduleProps) {
  const [status, setStatus] = useState<SubscriptionStatus>('CONNECTING')

  // Create a stable supabase client
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Memoize the schedule update handler
  const handleScheduleUpdate = useCallback(
    (payload: SchedulePayload) => {
      try {
        // Type guard to ensure payload.new exists and is an object
        if (!payload.new || typeof payload.new !== 'object') {
          console.error('Invalid payload structure:', payload)
          return
        }

        const schedule = payload.new as Schedule
        
        // Validate required schedule properties
        if (!schedule.id) {
          console.error('Invalid schedule data:', schedule)
          return
        }

        toast({
          title: 'Schedule Updated',
          description: 'The schedule has been modified.',
        })

        onScheduleUpdate(schedule)
      } catch (error) {
        console.error('Error handling schedule update:', error)
        toast({
          title: 'Update Error',
          description: 'Failed to process schedule update.',
          variant: 'destructive',
        })
      }
    },
    [onScheduleUpdate]
  )

  useEffect(() => {
    let mounted = true
    let retryCount = 0
    const MAX_RETRIES = 3
    let cleanupFn: (() => void) | undefined

    function setupSubscription() {
      try {
        if (mounted) setStatus('CONNECTING')

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
              if (mounted) {
                handleScheduleUpdate(payload)
              }
            }
          )
          .subscribe((status) => {
            if (!mounted) return

            if (status === 'SUBSCRIBED') {
              setStatus('SUBSCRIBED')
              retryCount = 0 // Reset retry count on successful connection
            } else if (status === 'CLOSED') {
              setStatus('CLOSED')
              // Attempt to reconnect if we haven't exceeded max retries
              if (retryCount < MAX_RETRIES) {
                retryCount++
                setTimeout(setupSubscription, 1000 * retryCount) // Exponential backoff
              } else {
                setStatus('CHANNEL_ERROR')
              }
            } else if (status === 'CHANNEL_ERROR') {
              setStatus('CHANNEL_ERROR')
            }
          })

        cleanupFn = () => {
          if (mounted) {
            supabase.removeChannel(channel)
          }
        }
      } catch (error) {
        console.error('Error setting up subscription:', error)
        if (mounted) {
          setStatus('CHANNEL_ERROR')
        }
      }
    }

    setupSubscription()

    return () => {
      mounted = false
      cleanupFn?.()
    }
  }, [handleScheduleUpdate, supabase])

  return <RealtimeLoadingState status={status} />
}

export default function RealtimeSchedule(props: RealtimeScheduleProps) {
  return (
    <RealtimeErrorBoundary>
      <RealtimeScheduleInner {...props} />
    </RealtimeErrorBoundary>
  )
}
