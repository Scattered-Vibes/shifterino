import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getEmployeeSchedule } from '@/lib/supabase/service';

export function useEmployeeSchedule(
  employeeId: string,
  startDate: string,
  endDate: string
) {
  const queryClient = useQueryClient();
  const supabase = getSupabaseClient();

  const query = useQuery({
    queryKey: ['employeeSchedule', employeeId, startDate, endDate],
    queryFn: async () => {
      const response = await getEmployeeSchedule(employeeId, startDate, endDate);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    }
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('schedule-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'individual_shifts',
        filter: `employee_id=eq.${employeeId}`
      }, () => {
        // Invalidate and refetch with complete query key
        queryClient.invalidateQueries({
          queryKey: ['employeeSchedule', employeeId, startDate, endDate]
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employeeId, startDate, endDate, queryClient, supabase]);

  return query;
} 