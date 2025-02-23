'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase/database';
import { toast } from '@/components/ui/use-toast';

interface ScheduleSubscriptionProps {
  employeeId: string;
  onScheduleUpdate?: () => void;
}

export function ScheduleSubscription({ employeeId, onScheduleUpdate }: ScheduleSubscriptionProps) {
  useEffect(() => {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Subscribe to individual shifts changes
    const shiftsChannel = supabase
      .channel('individual-shifts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'individual_shifts',
          filter: `employee_id=eq.${employeeId}`,
        },
        (payload) => {
          const event = payload.eventType;
          toast({
            title: 'Schedule Update',
            description: `Your schedule has been ${event === 'INSERT' ? 'updated' : event === 'DELETE' ? 'removed' : 'modified'}.`,
          });
          onScheduleUpdate?.();
        }
      )
      .subscribe();

    // Subscribe to shift swap request changes
    const swapsChannel = supabase
      .channel('shift-swaps')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shift_swap_requests',
          filter: `requester_id=eq.${employeeId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const newStatus = payload.new.status;
            toast({
              title: 'Shift Swap Request Update',
              description: `Your shift swap request has been ${newStatus}.`,
            });
            onScheduleUpdate?.();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(shiftsChannel);
      supabase.removeChannel(swapsChannel);
    };
  }, [employeeId, onScheduleUpdate]);

  return null;
} 