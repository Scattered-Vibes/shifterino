import { createClient } from '@/lib/supabase/client'
import type { ShiftSwapRequest } from '@/types'
import { handleError } from '@/lib/utils/error-handler'

const supabase = createClient()

export async function getShiftSwapRequests() {
  try {
    const { data, error } = await supabase
      .from('shift_swap_requests')
      .select(`
        *,
        requester:employees(*),
        reviewer:employees(*),
        original_shift:schedules(*),
        proposed_shift:schedules(*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as ShiftSwapRequest[]
  } catch (error) {
    handleError(error)
    return []
  }
}

export async function getShiftSwapRequest(id: string) {
  try {
    const { data, error } = await supabase
      .from('shift_swap_requests')
      .select(`
        *,
        requester:employees(*),
        reviewer:employees(*),
        original_shift:schedules(*),
        proposed_shift:schedules(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as ShiftSwapRequest
  } catch (error) {
    handleError(error)
    return null
  }
}

export async function createShiftSwapRequest(request: Omit<ShiftSwapRequest, 'id' | 'status' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('shift_swap_requests')
      .insert([{ ...request, status: 'pending' as const }])
      .select()
      .single()

    if (error) throw error
    return data as ShiftSwapRequest
  } catch (error) {
    handleError(error)
    return null
  }
}

export async function updateShiftSwapRequest(id: string, request: Partial<ShiftSwapRequest>) {
  try {
    const { data, error } = await supabase
      .from('shift_swap_requests')
      .update(request)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as ShiftSwapRequest
  } catch (error) {
    handleError(error)
    return null
  }
}

export async function deleteShiftSwapRequest(id: string) {
  try {
    const { error } = await supabase
      .from('shift_swap_requests')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    handleError(error)
    return false
  }
}

export async function reviewShiftSwapRequest(id: string, status: 'approved' | 'rejected', reviewerId: string) {
  try {
    const { data, error } = await supabase
      .from('shift_swap_requests')
      .update({
        status,
        reviewer_id: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as ShiftSwapRequest
  } catch (error) {
    handleError(error)
    return null
  }
} 