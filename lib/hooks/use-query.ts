import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { startOfMonth, endOfMonth } from 'date-fns'
import { getSchedules, getEmployees, getShifts } from '@/lib/utils/query'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Hook for fetching schedules
export function useSchedules(date: Date = new Date()) {
  return useQuery({
    queryKey: ['schedules', date],
    queryFn: () => getSchedules(startOfMonth(date), endOfMonth(date))
  })
}

// Hook for fetching employees
export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployees()
  })
}

// Hook for fetching shifts
export function useShifts(scheduleId: string) {
  return useQuery({
    queryKey: ['shifts', scheduleId],
    queryFn: () => getShifts(scheduleId),
    enabled: !!scheduleId
  })
}

// Example of a mutation hook for creating a shift
export function useCreateShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: {
      scheduleId: string
      employeeId: string
      startTime: string
      endTime: string
    }) => {
      const { data, error } = await supabase
        .from('shifts')
        .insert([
          {
            schedule_id: variables.scheduleId,
            employee_id: variables.employeeId,
            start_time: variables.startTime,
            end_time: variables.endTime
          }
        ])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['shifts', variables.scheduleId]
      })
    }
  })
} 