'use client'

import { useEffect } from 'react'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { realtimeManager } from '@/lib/supabase/realtime'
import { useQueryClient } from '@tanstack/react-query'
import {
  IndividualShift,
  ShiftSwapRequest,
  OnCallAssignment,
  OnCallActivation
} from '@/types/scheduling'

type SubscriptionType = 'shifts' | 'swapRequests' | 'onCallAssignments' | 'onCallActivations'
type SubscriptionPayload = IndividualShift | ShiftSwapRequest | OnCallAssignment | OnCallActivation

interface UseRealtimeSubscriptionOptions {
  type: SubscriptionType
  id?: string
  onInsert?: (payload: RealtimePostgresChangesPayload<SubscriptionPayload>) => void
  onUpdate?: (payload: RealtimePostgresChangesPayload<SubscriptionPayload>) => void
  onDelete?: (payload: RealtimePostgresChangesPayload<SubscriptionPayload>) => void
  queryKey?: string[]
}

export function useRealtimeSubscription({
  type,
  id,
  onInsert,
  onUpdate,
  onDelete,
  queryKey
}: UseRealtimeSubscriptionOptions) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const handleChange = (payload: RealtimePostgresChangesPayload<SubscriptionPayload>) => {
      // Handle specific events
      switch (payload.eventType) {
        case 'INSERT':
          onInsert?.(payload)
          break
        case 'UPDATE':
          onUpdate?.(payload)
          break
        case 'DELETE':
          onDelete?.(payload)
          break
      }

      // Invalidate queries if queryKey is provided
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey })
      }
    }

    let unsubscribe: () => void

    switch (type) {
      case 'shifts':
        unsubscribe = realtimeManager.subscribeToShifts(handleChange, id)
        break
      case 'swapRequests':
        unsubscribe = realtimeManager.subscribeToSwapRequests(handleChange, id)
        break
      case 'onCallAssignments':
        unsubscribe = realtimeManager.subscribeToOnCallAssignments(handleChange, id)
        break
      case 'onCallActivations':
        unsubscribe = realtimeManager.subscribeToOnCallActivations(handleChange, id)
        break
    }

    return () => {
      unsubscribe?.()
    }
  }, [type, id, onInsert, onUpdate, onDelete, queryKey, queryClient])
}

// Type-safe hooks for specific subscriptions
export function useShiftSubscription(
  options: Omit<UseRealtimeSubscriptionOptions, 'type'> & {
    onInsert?: (payload: RealtimePostgresChangesPayload<IndividualShift>) => void
    onUpdate?: (payload: RealtimePostgresChangesPayload<IndividualShift>) => void
    onDelete?: (payload: RealtimePostgresChangesPayload<IndividualShift>) => void
  }
) {
  return useRealtimeSubscription({ ...options, type: 'shifts' })
}

export function useSwapRequestSubscription(
  options: Omit<UseRealtimeSubscriptionOptions, 'type'> & {
    onInsert?: (payload: RealtimePostgresChangesPayload<ShiftSwapRequest>) => void
    onUpdate?: (payload: RealtimePostgresChangesPayload<ShiftSwapRequest>) => void
    onDelete?: (payload: RealtimePostgresChangesPayload<ShiftSwapRequest>) => void
  }
) {
  return useRealtimeSubscription({ ...options, type: 'swapRequests' })
}

export function useOnCallAssignmentSubscription(
  options: Omit<UseRealtimeSubscriptionOptions, 'type'> & {
    onInsert?: (payload: RealtimePostgresChangesPayload<OnCallAssignment>) => void
    onUpdate?: (payload: RealtimePostgresChangesPayload<OnCallAssignment>) => void
    onDelete?: (payload: RealtimePostgresChangesPayload<OnCallAssignment>) => void
  }
) {
  return useRealtimeSubscription({ ...options, type: 'onCallAssignments' })
}

export function useOnCallActivationSubscription(
  options: Omit<UseRealtimeSubscriptionOptions, 'type'> & {
    onInsert?: (payload: RealtimePostgresChangesPayload<OnCallActivation>) => void
    onUpdate?: (payload: RealtimePostgresChangesPayload<OnCallActivation>) => void
    onDelete?: (payload: RealtimePostgresChangesPayload<OnCallActivation>) => void
  }
) {
  return useRealtimeSubscription({ ...options, type: 'onCallActivations' })
} 