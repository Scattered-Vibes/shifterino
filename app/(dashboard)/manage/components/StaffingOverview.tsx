'use client'

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export interface StaffingOverviewProps {
  timeBlock: string;
}

interface StaffingData {
  current_staff: number;
  required_staff: number;
  supervisor_count: number;
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
        const { data, error } = await supabase
          .from('staffing_requirements')
          .select('current_staff, required_staff, supervisor_count')
          .eq('time_block', timeBlock)
          .single();

        if (!isMounted) return;

        if (error) {
          setError('Error loading staffing data');
          setLoading(false);
          return;
        }

        setStaffingData(data);
        setLoading(false);
      } catch (err) {
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
          setStaffingData(payload.new as StaffingData);
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

  const isUnderstaffed = staffingData.current_staff < staffingData.required_staff;

  return (
    <div className="p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-2">Staffing Overview - {timeBlock}</h3>
      <div className="space-y-2">
        <p>Current Staff: {staffingData.current_staff}</p>
        <p>Required Staff: {staffingData.required_staff}</p>
        <p>Supervisors: {staffingData.supervisor_count}</p>
        {isUnderstaffed && (
          <div role="alert" className="text-red-600 font-bold">
            Understaffed
          </div>
        )}
      </div>
    </div>
  );
}
