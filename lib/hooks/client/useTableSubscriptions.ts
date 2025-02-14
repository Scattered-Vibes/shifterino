'use client'

import { useEffect } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'
import { subscribeToTable } from '@/lib/supabase/realtime/generic-subscription'

type Tables = Database['public']['Tables']
type ShiftRow = Tables['individual_shifts']['Row']
type SwapRequestRow = Tables['shift_swap_requests']['Row']
type StaffingRequirementRow = Tables['staffing_requirements']['Row']

export interface SubscriptionCallbacks<T extends object> {
  onInsert?: (payload: RealtimePostgresChangesPayload<T>) => void
  onUpdate?: (payload: RealtimePostgresChangesPayload<T>) => void
  onDelete?: (payload: RealtimePostgresChangesPayload<T>) => void
}

function createSubscriptionHandler<T extends object>(callbacks: SubscriptionCallbacks<T>) {
  return (payload: RealtimePostgresChangesPayload<T>) => {
    switch (payload.eventType) {
      case 'INSERT':
        callbacks.onInsert?.(payload)
        break
      case 'UPDATE':
        callbacks.onUpdate?.(payload)
        break
      case 'DELETE':
        callbacks.onDelete?.(payload)
        break
    }
  }
}

export function useShiftSubscription(callbacks: SubscriptionCallbacks<ShiftRow>) {
  useEffect(() => {
    const unsubscribe = subscribeToTable({
      table: 'individual_shifts',
      onData: createSubscriptionHandler(callbacks)
    })
    return unsubscribe
  }, [callbacks])
}

export function useSwapRequestSubscription(callbacks: SubscriptionCallbacks<SwapRequestRow>) {
  useEffect(() => {
    const unsubscribe = subscribeToTable({
      table: 'shift_swap_requests',
      onData: createSubscriptionHandler(callbacks)
    })
    return unsubscribe
  }, [callbacks])
}

export function useStaffingRequirementSubscription(callbacks: SubscriptionCallbacks<StaffingRequirementRow>) {
  useEffect(() => {
    const unsubscribe = subscribeToTable({
      table: 'staffing_requirements',
      onData: createSubscriptionHandler(callbacks)
    })
    return unsubscribe
  }, [callbacks])
} 