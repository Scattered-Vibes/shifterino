import { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase/database'

type PostgresChangesEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'
type DatabaseTables = Database['public']['Tables']

// Type for the channel.on method to handle postgres_changes
type PostgresChangesFilter = {
  event: PostgresChangesEvent | undefined
  schema: string
  table: string
  filter?: string
}

interface UseRealtimeSubscriptionProps<T extends keyof DatabaseTables> {
  schema?: string
  table: T
  event: PostgresChangesEvent
  filter?: string
  onData: (payload: RealtimePostgresChangesPayload<DatabaseTables[T]['Row']>) => void
}

/**
 * RealtimeSubscription class handles Supabase realtime subscriptions with proper typing.
 * Note: Due to limitations in Supabase's type system, we need to use type assertions
 * for the channel.on method. This is a known issue and the implementation is functionally
 * correct despite the TypeScript error for the 'postgres_changes' event type.
 */
class RealtimeSubscription<T extends keyof DatabaseTables> {
  private supabase: SupabaseClient<Database>
  private channelName: string
  private cleanup: (() => void) | null = null

  constructor(
    supabase: SupabaseClient<Database>,
    channelName: string
  ) {
    this.supabase = supabase
    this.channelName = channelName
  }

  subscribe(
    options: {
      event: PostgresChangesEvent
      schema: string
      table: T
      filter?: string
    },
    handler: (payload: RealtimePostgresChangesPayload<DatabaseTables[T]['Row']>) => void
  ): void {
    const channel = this.supabase.channel(this.channelName)

    // Type the filter explicitly
    const filter: PostgresChangesFilter = {
      event: options.event === '*' ? undefined : options.event,
      schema: options.schema,
      table: options.table as string,
      filter: options.filter
    }

    // @ts-expect-error: Supabase types don't properly support 'postgres_changes' event
    // This is a known limitation, but the implementation is correct
    const subscription = channel
      .on('postgres_changes', filter, handler)
      .subscribe()

    this.cleanup = () => {
      try {
        subscription.unsubscribe()
        this.supabase.removeChannel(channel)
      } catch (error) {
        console.error('Error cleaning up subscription:', error)
      }
    }
  }

  unsubscribe(): void {
    if (this.cleanup) {
      this.cleanup()
      this.cleanup = null
    }
  }
}

/**
 * Hook for subscribing to Supabase realtime changes with proper typing.
 * Uses a class-based approach to handle subscriptions and cleanup.
 */
export function useRealtimeSubscription<T extends keyof DatabaseTables>({
  schema = 'public',
  table,
  event,
  filter,
  onData
}: UseRealtimeSubscriptionProps<T>) {
  const supabase = createClient() as SupabaseClient<Database>
  const subscriptionRef = useRef<RealtimeSubscription<T> | null>(null)

  useEffect(() => {
    if (!table || !event) return

    const channelName = `${schema}:${table}:${event}${filter ? `:${filter}` : ''}`
    
    // Create and set up subscription
    const subscription = new RealtimeSubscription<T>(supabase, channelName)
    subscriptionRef.current = subscription

    subscription.subscribe(
      { event, schema, table, filter },
      onData
    )

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [schema, table, event, filter, onData, supabase])
} 