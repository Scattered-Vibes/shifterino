import { createBrowserInstance } from '../clientInstance'
import type { RealtimePostgresChangesPayload, RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'

type DatabaseTables = Database['public']['Tables']
type TableName = keyof DatabaseTables
type Event = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

export interface SubscriptionOptions<T extends TableName> {
  table: T
  event?: Event
  schema?: string
  filter?: string
  onData: (payload: RealtimePostgresChangesPayload<DatabaseTables[T]['Row']>) => void
}

/**
 * Generic realtime subscription handler
 * @template T - The table name from the database
 */
export function subscribeToTable<T extends TableName>(options: SubscriptionOptions<T>): () => void {
  const supabase = createBrowserInstance()
  const channel = supabase
    .channel(`${options.schema || 'public'}:${options.table}`)
    .on(
      'postgres_changes' as const,
      {
        event: options.event || '*',
        schema: options.schema || 'public',
        table: options.table,
        filter: options.filter,
      },
      options.onData
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// Type-safe subscription creators for specific tables
export function createShiftSubscription(
  onData: (payload: RealtimePostgresChangesPayload<DatabaseTables['individual_shifts']['Row']>) => void,
  filter?: string
) {
  return subscribeToTable({
    table: 'individual_shifts',
    onData,
    filter
  })
}

export function createSwapRequestSubscription(
  onData: (payload: RealtimePostgresChangesPayload<DatabaseTables['shift_swap_requests']['Row']>) => void,
  filter?: string
) {
  return subscribeToTable({
    table: 'shift_swap_requests',
    onData,
    filter
  })
}

export function createTimeOffRequestSubscription(
  onData: (payload: RealtimePostgresChangesPayload<DatabaseTables['time_off_requests']['Row']>) => void,
  filter?: string
) {
  return subscribeToTable({
    table: 'time_off_requests',
    onData,
    filter
  })
}

export function createStaffingRequirementSubscription(
  onData: (payload: RealtimePostgresChangesPayload<DatabaseTables['staffing_requirements']['Row']>) => void,
  filter?: string
) {
  return subscribeToTable({
    table: 'staffing_requirements',
    onData,
    filter
  })
} 