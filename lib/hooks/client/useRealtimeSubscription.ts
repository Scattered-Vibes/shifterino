'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'

type DatabaseTables = Database['public']['Tables']
type TableName = keyof DatabaseTables
type Event = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface UseRealtimeSubscriptionProps<T extends TableName> {
  schema?: string
  table: T
  event?: Event
  filter?: string
  onData: (payload: RealtimePostgresChangesPayload<DatabaseTables[T]['Row']>) => void
}

/**
 * Hook to subscribe to Supabase realtime changes
 * @template T - The table name from the database
 */
export function useRealtimeSubscription<T extends TableName>({
  schema = 'public',
  table,
  event = '*',
  filter,
  onData
}: UseRealtimeSubscriptionProps<T>) {
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`${schema}:${table}`)
      .on(
        'postgres_changes' as const,
        { event, schema, table, filter },
        // Type assertion needed due to Supabase types not being fully compatible
        (payload) => onData(payload as RealtimePostgresChangesPayload<DatabaseTables[T]['Row']>)
      )
      .subscribe()

    return () => {
      channel.unsubscribe().catch(error => {
        console.error('Error unsubscribing from channel:', error)
      })
    }
  }, [schema, table, event, filter, onData])
}

// Type-safe hooks for specific subscriptions
export function useShiftSubscription(
  options: Omit<UseRealtimeSubscriptionProps<TableName>, 'table'> & {
    onInsert?: (payload: RealtimePostgresChangesPayload<IndividualShift>) => void
    onUpdate?: (payload: RealtimePostgresChangesPayload<IndividualShift>) => void
    onDelete?: (payload: RealtimePostgresChangesPayload<IndividualShift>) => void
  }
) {
  return useRealtimeSubscription({ ...options, table: 'shifts' })
}

export function useSwapRequestSubscription(
  options: Omit<UseRealtimeSubscriptionProps<TableName>, 'table'> & {
    onInsert?: (payload: RealtimePostgresChangesPayload<ShiftSwapRequest>) => void
    onUpdate?: (payload: RealtimePostgresChangesPayload<ShiftSwapRequest>) => void
    onDelete?: (payload: RealtimePostgresChangesPayload<ShiftSwapRequest>) => void
  }
) {
  return useRealtimeSubscription({ ...options, table: 'swapRequests' })
}

export function useOnCallAssignmentSubscription(
  options: Omit<UseRealtimeSubscriptionProps<TableName>, 'table'> & {
    onInsert?: (payload: RealtimePostgresChangesPayload<OnCallAssignment>) => void
    onUpdate?: (payload: RealtimePostgresChangesPayload<OnCallAssignment>) => void
    onDelete?: (payload: RealtimePostgresChangesPayload<OnCallAssignment>) => void
  }
) {
  return useRealtimeSubscription({ ...options, table: 'onCallAssignments' })
}

export function useOnCallActivationSubscription(
  options: Omit<UseRealtimeSubscriptionProps<TableName>, 'table'> & {
    onInsert?: (payload: RealtimePostgresChangesPayload<OnCallActivation>) => void
    onUpdate?: (payload: RealtimePostgresChangesPayload<OnCallActivation>) => void
    onDelete?: (payload: RealtimePostgresChangesPayload<OnCallActivation>) => void
  }
) {
  return useRealtimeSubscription({ ...options, table: 'onCallActivations' })
} 