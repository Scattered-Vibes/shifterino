'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase/database';
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
    let channel: RealtimeChannel;

    try {
      channel = supabase
        .channel(`${table}-changes`)
        .on('postgres_changes' as const, 
          { event, schema: 'public', table, filter },
          (payload: RealtimePostgresChangesPayload<Database['public']['Tables'][T]['Row']>) => {
            onData(payload);
            toast({
              title: 'Update Received',
              description: `${table} data has been updated.`,
            });
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
      return;
    }

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