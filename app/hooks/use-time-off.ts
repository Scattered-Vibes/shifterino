import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type TimeOffRequest } from '@/types'
import { supabase } from '@/lib/supabase/client'

const TIME_OFF_KEY = 'time-off'

interface UseTimeOffOptions {
  employeeId?: string
  startDate?: string
  endDate?: string
  status?: 'pending' | 'approved' | 'rejected'
}

export function useTimeOff(options: UseTimeOffOptions = {}) {
  const { employeeId, startDate, endDate, status } = options

  return useQuery({
    queryKey: [TIME_OFF_KEY, employeeId, startDate, endDate, status],
    queryFn: async () => {
      let query = supabase
        .from('time_off_requests')
        .select(`
          *,
          employee:employees(id, first_name, last_name)
        `)

      if (employeeId) {
        query = query.eq('employee_id', employeeId)
      }

      if (startDate) {
        query = query.gte('start_date', startDate)
      }

      if (endDate) {
        query = query.lte('end_date', endDate)
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

export type TimeOffRequestData = {
  employee_id: string
  start_date: string
  end_date: string
  reason: string
  notes?: string | null
}

export function useCreateTimeOff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TimeOffRequestData) => {
      const { data: newRequest, error } = await supabase
        .from('time_off_requests')
        .insert({ ...data, status: 'pending' })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return newRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TIME_OFF_KEY] })
    }
  })
}

export function useUpdateTimeOff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TimeOffRequest['status'] }) => {
      const { data: updatedRequest, error } = await supabase
        .from('time_off_requests')
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
      queryClient.invalidateQueries({ queryKey: [TIME_OFF_KEY] })
    }
  })
} 