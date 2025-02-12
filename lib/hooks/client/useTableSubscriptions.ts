'use client'

import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'
import { useRealtimeSubscription } from './useRealtimeSubscription'

type Tables = Database['public']['Tables']
type ShiftRow = Tables['individual_shifts']['Row']
type SwapRequestRow = Tables['shift_swap_requests']['Row']
type StaffingRequirementRow = Tables['staffing_requirements']['Row']

interface SubscriptionCallbacks<T extends object> {
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
  return useRealtimeSubscription({
    table: 'individual_shifts',
    onData: createSubscriptionHandler(callbacks)
  })
}

export function useSwapRequestSubscription(callbacks: SubscriptionCallbacks<SwapRequestRow>) {
  return useRealtimeSubscription({
    table: 'shift_swap_requests',
    onData: createSubscriptionHandler(callbacks)
  })
}

export function useStaffingRequirementSubscription(callbacks: SubscriptionCallbacks<StaffingRequirementRow>) {
  return useRealtimeSubscription({
    table: 'staffing_requirements',
    onData: createSubscriptionHandler(callbacks)
  })
} 