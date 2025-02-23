'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase/database';
import { toast } from '@/components/ui/use-toast';

type Table = keyof Database['public']['Tables'];
type Event = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface SubscriptionOptions<T extends Table> {
  table: T;
  event?: Event;
  filter?: string;
  onData: (payload: RealtimePostgresChangesPayload<Database['public']['Tables'][T]['Row']>) => void;
}

export function useRealtimeSubscription<T extends Table>({
  table,
  event = '*',
  filter,
  onData,
}: SubscriptionOptions<T>) {
  useEffect(() => {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    type Row = Database['public']['Tables'][T]['Row'];
    const channel = supabase
      .channel(`${table}-changes`)
      .on<'postgres_changes'>(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter,
        },
        (payload: RealtimePostgresChangesPayload<Row>) => {
          onData(payload);
          toast({
            title: 'Update Received',
            description: `${table} data has been updated.`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, filter, onData]);
}

// Example usage:
/*
useRealtimeSubscription({
  table: 'individual_shifts',
  filter: `employee_id=eq.${employeeId}`,
  onData: (payload) => {
    if (payload.eventType === 'UPDATE') {
      // Handle shift update
    }
  },
});
*/