'use client'

import { useEffect } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'
import { subscribeToTable, type SubscriptionOptions } from '@/lib/supabase/realtime/generic-subscription'

type DatabaseTables = Database['public']['Tables']
type TableName = keyof DatabaseTables

/**
 * Hook to subscribe to Supabase realtime changes
 * @template T - The table name from the database
 */
export function useRealtimeSubscription<T extends TableName>(
  options: SubscriptionOptions<T>
) {
  useEffect(() => {
    const unsubscribe = subscribeToTable(options)
    return () => {
      unsubscribe()
    }
  }, [options])
}

// Type-safe hooks for specific subscriptions
export function useShiftSubscription(
  onData: (payload: RealtimePostgresChangesPayload<DatabaseTables['individual_shifts']['Row']>) => void,
  filter?: string
) {
  useRealtimeSubscription({
    table: 'individual_shifts',
    onData,
    filter
  })
}

export function useSwapRequestSubscription(
  onData: (payload: RealtimePostgresChangesPayload<DatabaseTables['shift_swap_requests']['Row']>) => void,
  filter?: string
) {
  useRealtimeSubscription({
    table: 'shift_swap_requests',
    onData,
    filter
  })
}

export function useTimeOffRequestSubscription(
  onData: (payload: RealtimePostgresChangesPayload<DatabaseTables['time_off_requests']['Row']>) => void,
  filter?: string
) {
  useRealtimeSubscription({
    table: 'time_off_requests',
    onData,
    filter
  })
}

export function useStaffingRequirementSubscription(
  onData: (payload: RealtimePostgresChangesPayload<DatabaseTables['staffing_requirements']['Row']>) => void,
  filter?: string
) {
  useRealtimeSubscription({
    table: 'staffing_requirements',
    onData,
    filter
  })
} 