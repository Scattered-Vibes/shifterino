'use client'

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase/database';

export interface StaffingOverviewProps {
  timeBlock: string;
}

type StaffingRequirements = Database['public']['Tables']['staffing_requirements']['Row'];

interface StaffingData {
  min_total_staff: StaffingRequirements['min_total_staff'];
  min_supervisors: StaffingRequirements['min_supervisors'];
  time_block_start: StaffingRequirements['time_block_start'];
  time_block_end: StaffingRequirements['time_block_end'];
}

export function StaffingOverview({ timeBlock }: StaffingOverviewProps) {
  const [staffingData, setStaffingData] = useState<StaffingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();
    
    // Fetch initial data
    async function fetchStaffingData() {
      try {
        const { data, error: queryError } = await supabase
          .from('staffing_requirements')
          .select('min_total_staff, min_supervisors, time_block_start, time_block_end')
          .eq('time_block', timeBlock)
          .single();

        if (!isMounted) return;

        if (queryError) {
          setError('Error loading staffing data');
          setLoading(false);
          return;
        }

        setStaffingData(data);
        setLoading(false);
      } catch {
        if (!isMounted) return;
        setError('Error loading staffing data');
        setLoading(false);
      }
    }

    fetchStaffingData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('staffing-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'staffing_requirements',
        filter: `time_block=eq.${timeBlock}`
      }, (payload) => {
        if (isMounted) {
          const newData = payload.new as StaffingRequirements;
          setStaffingData({
            min_total_staff: newData.min_total_staff,
            min_supervisors: newData.min_supervisors,
            time_block_start: newData.time_block_start,
            time_block_end: newData.time_block_end
          });
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [timeBlock]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!staffingData) return null;

  const isUnderstaffed = staffingData.min_total_staff > 0; // TODO: Compare with actual staff count

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 text-lg font-semibold">
        Staffing Overview - {staffingData.time_block_start} to {staffingData.time_block_end}
      </h3>
      <div className="space-y-2">
        <p>Required Staff: {staffingData.min_total_staff}</p>
        <p>Required Supervisors: {staffingData.min_supervisors}</p>
        {isUnderstaffed && (
          <div role="alert" className="font-bold text-red-600">
            Understaffed
          </div>
        )}
      </div>
    </div>
  );
}
