import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { IndividualShift, ShiftSwapRequest, OnCallAssignment, OnCallActivation } from '@/types/scheduling'

type TableName = 'individual_shifts' | 'shift_swap_requests' | 'on_call_assignments' | 'on_call_activations'
type ChangeType = 'INSERT' | 'UPDATE' | 'DELETE'

interface ChangeHandler<T> {
  (payload: RealtimePostgresChangesPayload<T>): void
}

export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()
  private handlers: Map<string, Set<ChangeHandler<any>>> = new Map()
  private supabase = createClient()

  private getChannelKey(table: TableName, filter?: string): string {
    return `${table}${filter ? `:${filter}` : ''}`
  }

  subscribe<T>(
    table: TableName,
    handler: ChangeHandler<T>,
    filter?: { column: string; value: string }
  ): () => void {
    const channelKey = this.getChannelKey(table, filter?.column)

    if (!this.channels.has(channelKey)) {
      let channel = this.supabase
        .channel(channelKey)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter: filter ? `${filter.column}=eq.${filter.value}` : undefined
          },
          (payload) => {
            const handlers = this.handlers.get(channelKey)
            if (handlers) {
              handlers.forEach(h => h(payload))
            }
          }
        )
        .subscribe()

      this.channels.set(channelKey, channel)
    }

    if (!this.handlers.has(channelKey)) {
      this.handlers.set(channelKey, new Set())
    }

    this.handlers.get(channelKey)!.add(handler)

    return () => {
      const handlers = this.handlers.get(channelKey)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          const channel = this.channels.get(channelKey)
          if (channel) {
            this.supabase.removeChannel(channel)
            this.channels.delete(channelKey)
            this.handlers.delete(channelKey)
          }
        }
      }
    }
  }

  subscribeToShifts(
    handler: ChangeHandler<IndividualShift>,
    schedulePeriodId?: string
  ): () => void {
    if (schedulePeriodId) {
      return this.subscribe('individual_shifts', handler, {
        column: 'schedule_period_id',
        value: schedulePeriodId
      })
    }
    return this.subscribe('individual_shifts', handler)
  }

  subscribeToSwapRequests(
    handler: ChangeHandler<ShiftSwapRequest>,
    employeeId?: string
  ): () => void {
    if (employeeId) {
      return this.subscribe('shift_swap_requests', handler, {
        column: 'requesting_employee_id',
        value: employeeId
      })
    }
    return this.subscribe('shift_swap_requests', handler)
  }

  subscribeToOnCallAssignments(
    handler: ChangeHandler<OnCallAssignment>,
    employeeId?: string
  ): () => void {
    if (employeeId) {
      return this.subscribe('on_call_assignments', handler, {
        column: 'employee_id',
        value: employeeId
      })
    }
    return this.subscribe('on_call_assignments', handler)
  }

  subscribeToOnCallActivations(
    handler: ChangeHandler<OnCallActivation>,
    assignmentId?: string
  ): () => void {
    if (assignmentId) {
      return this.subscribe('on_call_activations', handler, {
        column: 'assignment_id',
        value: assignmentId
      })
    }
    return this.subscribe('on_call_activations', handler)
  }
}

export const realtimeManager = new RealtimeManager() 