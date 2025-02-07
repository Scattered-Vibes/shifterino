import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'

export interface TimeOffRequest {
  id: string
  employee_id: string
  start_date: string
  end_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export async function getTimeOffRequests() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('time_off_requests')
    .select('*')
    .order('start_date', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data as unknown as TimeOffRequest[]
}

export function useTimeOffRequests() {
  return useQuery({
    queryKey: ['timeOffRequests'],
    queryFn: getTimeOffRequests,
  })
} 