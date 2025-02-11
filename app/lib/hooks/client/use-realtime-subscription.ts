import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface UseRealtimeSubscriptionOptions {
  schema?: string
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  onData: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
}

export function useRealtimeSubscription({
  schema = 'public',
  table,
  event = '*',
  filter,
  onData,
}: UseRealtimeSubscriptionOptions) {
  const supabase = createClient()

  useEffect(() => {
    let channel: RealtimeChannel

    const setupSubscription = async () => {
      // Create the channel
      channel = supabase.channel(`${schema}:${table}`)

      // Set up the subscription
      channel = channel.on(
        'postgres_changes' as const,
        {
          event,
          schema,
          table,
          filter,
        },
        (payload) => {
          onData(payload)
        }
      )

      // Subscribe to the channel
      await channel.subscribe()
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [schema, table, event, filter, onData])
} 