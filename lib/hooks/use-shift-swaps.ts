import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'

export interface ShiftSwapRequest {
  id: string
  requester_id: string
  accepter_id: string | null
  schedule_id: string
  target_schedule_id: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  reason: string
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export async function getShiftSwapRequests() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('shift_swap_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data as unknown as ShiftSwapRequest[]
}

export function useShiftSwapRequests() {
  return useQuery({
    queryKey: ['shiftSwapRequests'],
    queryFn: getShiftSwapRequests,
  })
} 