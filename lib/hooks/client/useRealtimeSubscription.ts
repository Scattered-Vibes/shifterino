'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient, type Tables } from '@/lib/supabase/client'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { realtimeManager } from '@/lib/supabase/realtime'
import {
  IndividualShift,
  ShiftSwapRequest,
  OnCallAssignment,
  OnCallActivation
} from '@/types/scheduling'

type TableName = keyof Tables
type RowType<T extends TableName> = Tables[T]['Row']

interface UseRealtimeSubscriptionOptions<T extends TableName> {
  table: T
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  onData?: (payload: { 
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    new: RowType<T>
    old: RowType<T>
  }) => void
}

export function useRealtimeSubscription<T extends TableName>({
  table,
  event = '*',
  filter,
  onData,
}: UseRealtimeSubscriptionOptions<T>) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          // Invalidate queries related to this table
          queryClient.invalidateQueries({ queryKey: [table] })
          
          // Call custom handler if provided
          if (onData) {
            onData({
              eventType: payload.eventType,
              new: payload.new as RowType<T>,
              old: payload.old as RowType<T>,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, event, filter, onData, queryClient, supabase])
}

// Type-safe hooks for specific subscriptions
export function useShiftSubscription(
  options: Omit<UseRealtimeSubscriptionOptions<TableName>, 'table'> & {
    onInsert?: (payload: RealtimePostgresChangesPayload<IndividualShift>) => void
    onUpdate?: (payload: RealtimePostgresChangesPayload<IndividualShift>) => void
    onDelete?: (payload: RealtimePostgresChangesPayload<IndividualShift>) => void
  }
) {
  return useRealtimeSubscription({ ...options, table: 'shifts' })
}

export function useSwapRequestSubscription(
  options: Omit<UseRealtimeSubscriptionOptions<TableName>, 'table'> & {
    onInsert?: (payload: RealtimePostgresChangesPayload<ShiftSwapRequest>) => void
    onUpdate?: (payload: RealtimePostgresChangesPayload<ShiftSwapRequest>) => void
    onDelete?: (payload: RealtimePostgresChangesPayload<ShiftSwapRequest>) => void
  }
) {
  return useRealtimeSubscription({ ...options, table: 'swapRequests' })
}

export function useOnCallAssignmentSubscription(
  options: Omit<UseRealtimeSubscriptionOptions<TableName>, 'table'> & {
    onInsert?: (payload: RealtimePostgresChangesPayload<OnCallAssignment>) => void
    onUpdate?: (payload: RealtimePostgresChangesPayload<OnCallAssignment>) => void
    onDelete?: (payload: RealtimePostgresChangesPayload<OnCallAssignment>) => void
  }
) {
  return useRealtimeSubscription({ ...options, table: 'onCallAssignments' })
}

export function useOnCallActivationSubscription(
  options: Omit<UseRealtimeSubscriptionOptions<TableName>, 'table'> & {
    onInsert?: (payload: RealtimePostgresChangesPayload<OnCallActivation>) => void
    onUpdate?: (payload: RealtimePostgresChangesPayload<OnCallActivation>) => void
    onDelete?: (payload: RealtimePostgresChangesPayload<OnCallActivation>) => void
  }
) {
  return useRealtimeSubscription({ ...options, table: 'onCallActivations' })
} 