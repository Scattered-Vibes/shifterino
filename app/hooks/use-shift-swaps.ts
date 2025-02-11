import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ShiftSwapRequest } from '@/types'
import { supabase } from '@/lib/supabase/client'

const SHIFT_SWAPS_KEY = 'shift-swaps'

interface UseShiftSwapsOptions {
  employeeId?: string
  status?: ShiftSwapRequest['status']
}

export function useShiftSwaps(options: UseShiftSwapsOptions = {}) {
  const { employeeId, status } = options

  return useQuery({
    queryKey: [SHIFT_SWAPS_KEY, employeeId, status],
    queryFn: async () => {
      let query = supabase
        .from('shift_swap_requests')
        .select(`
          *,
          requester:employees!requester_id(id, first_name, last_name),
          requested_employee:employees!requested_employee_id(id, first_name, last_name),
          shift:individual_shifts!shift_id(*),
          proposed_shift:individual_shifts!proposed_shift_id(*)
        `)

      if (employeeId) {
        query = query.or(`requester_id.eq.${employeeId},requested_employee_id.eq.${employeeId}`)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data
    }
  })
}

export type ShiftSwapRequestData = {
  requester_id: string
  requested_employee_id: string
  shift_id: string
  proposed_shift_id?: string | null
  notes?: string | null
}

export function useCreateShiftSwap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ShiftSwapRequestData) => {
      const { data: newRequest, error } = await supabase
        .from('shift_swap_requests')
        .insert({ ...data, status: 'pending' })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return newRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHIFT_SWAPS_KEY] })
    }
  })
}

export function useUpdateShiftSwap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ShiftSwapRequest['status'] }) => {
      const { data: updatedRequest, error } = await supabase
        .from('shift_swap_requests')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return updatedRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHIFT_SWAPS_KEY] })
    }
  })
} 