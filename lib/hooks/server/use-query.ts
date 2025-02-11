import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { createClient, type Tables, type Enums } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase/database'

const supabase = createClient()

// Hook for fetching schedules
export function useSchedules(date: Date) {
  return useQuery({
    queryKey: ['schedules', format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('date', format(date, 'yyyy-MM-dd'))
        .order('start_time')
      
      if (error) throw error
      return data as Tables['schedules']['Row'][]
    }
  })
}

// Hook for fetching employees
export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data as Tables['employees']['Row'][]
    }
  })
}

// Hook for fetching shifts by schedule
export function useScheduleShifts(scheduleId: string) {
  return useQuery({
    queryKey: ['shifts', scheduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('schedule_period_id', scheduleId)
        .order('start_time')
      
      if (error) throw error
      return data as Tables['schedules']['Row'][]
    }
  })
}

// Example of a mutation hook for creating a shift
export function useCreateShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (shift: Tables['schedules']['Insert']) => {
      const { data, error } = await supabase
        .from('schedules')
        .insert([{
          ...shift,
          status: 'scheduled' as Enums['shift_status'],
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      queryClient.invalidateQueries({ queryKey: ['schedules'] }) 
    }
  })
} 