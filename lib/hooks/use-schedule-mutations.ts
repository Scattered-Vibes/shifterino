import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { type Schedule } from './use-schedules'

interface CreateScheduleInput {
  employee_id: string
  start_date: string
  end_date: string
  shift_type: string
  shift_pattern: 'pattern_a' | 'pattern_b' | 'custom'
  is_supervisor: boolean
  status?: string
  created_by: string
  updated_by: string
}

interface UpdateScheduleInput extends Partial<CreateScheduleInput> {
  id: string
}

export function useCreateSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateScheduleInput) => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('schedules')
        .insert(input)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data as Schedule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateScheduleInput) => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('schedules')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data as Schedule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
} 