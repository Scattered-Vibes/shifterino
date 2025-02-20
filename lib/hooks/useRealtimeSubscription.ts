'use client'

import { useEffect } from 'react'
import { useSupabase } from '@/app/providers/SupabaseContext'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface SubscriptionOptions {
  table: string
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE'
  onData: (payload: RealtimePostgresChangesPayload<any>) => void
  filter?: string
}

export function useRealtimeSubscription({
  table,
  event,
  onData,
  filter
}: SubscriptionOptions) {
  const { supabase } = useSupabase()

  useEffect(() => {
    let channel: RealtimeChannel | null = null

    const setupSubscription = async () => {
      // Create the channel
      channel = supabase
        .channel(`db-changes-${table}`)
        // @ts-ignore - Type issue with Supabase types
        .on(
          'postgres_changes',
          {
            event,
            schema: 'public',
            table,
            filter
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            console.log(`Realtime update for ${table}:`, payload)
            onData(payload)
          }
        )
        .subscribe((status) => {
          console.log(`Subscription status for ${table}:`, status)
        })
    }

    setupSubscription()

    // Cleanup function
    return () => {
      if (channel) {
        console.log(`Removing channel for ${table}`)
        supabase.removeChannel(channel)
      }
    }
  }, [supabase, table, event, onData, filter])
} 