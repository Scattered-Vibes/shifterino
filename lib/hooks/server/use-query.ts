import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { getServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase/database'
import { handleError, ErrorCode } from '@/lib/utils/error-handler'

// Hook for fetching schedules
export function useSchedules(date: Date) {
  return useQuery({
    queryKey: ['schedules', format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await getServerClient()
        .from('schedules')
        .select('*')
        .eq('date', format(date, 'yyyy-MM-dd'))
        .order('start_time')
      
      if (error) throw error
      return data as Database['public']['Tables']['schedules']['Row'][]
    }
  })
}

// Hook for fetching employees
export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await getServerClient()
        .from('employees')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data as Database['public']['Tables']['employees']['Row'][]
    }
  })
}

// Hook for fetching shifts by schedule
export function useScheduleShifts(scheduleId: string) {
  return useQuery({
    queryKey: ['shifts', scheduleId],
    queryFn: async () => {
      const { data, error } = await getServerClient()
        .from('schedules')
        .select('*')
        .eq('schedule_period_id', scheduleId)
        .order('start_time')
      
      if (error) throw error
      return data as Database['public']['Tables']['schedules']['Row'][]
    }
  })
}

// Example of a mutation hook for creating a shift
export function useCreateShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (shift: Database['public']['Tables']['schedules']['Insert']) => {
      const { data, error } = await getServerClient()
        .from('schedules')
        .insert([{
          ...shift,
          status: 'scheduled' as Database['public']['Enums']['shift_status'],
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

export async function useQuery<T extends keyof Database['public']['Tables']>(
  table: T,
  options: {
    select?: string
    eq?: Record<string, any>
    order?: { column: string; ascending?: boolean }
  } = {}
) {
  const supabase = getServerClient()
  let query = supabase.from(table).select(options.select || '*')

  if (options.eq) {
    Object.entries(options.eq).forEach(([column, value]) => {
      query = query.eq(column, value)
    })
  }

  if (options.order) {
    query = query.order(options.order.column, { ascending: options.order.ascending })
  }

  const { data, error } = await query

  if (error) {
    throw handleError(error, ErrorCode.DATABASE_ERROR)
  }

  return data
} 