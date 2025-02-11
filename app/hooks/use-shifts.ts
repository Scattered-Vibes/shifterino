import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ShiftEvent, type ShiftUpdateData } from '@/types'
import { supabase } from '@/lib/supabase/client'

const SHIFTS_KEY = 'shifts'

interface UseShiftsOptions {
  employeeId?: string
  startDate?: string
  endDate?: string
}

export function useShifts(options: UseShiftsOptions = {}) {
  const { employeeId, startDate, endDate } = options

  return useQuery({
    queryKey: [SHIFTS_KEY, employeeId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('individual_shifts')
        .select(`
          *,
          employee:employees(id, first_name, last_name, role),
          shift_option:shift_options(*)
        `)

      if (employeeId) {
        query = query.eq('employee_id', employeeId)
      }

      if (startDate) {
        query = query.gte('date', startDate)
      }

      if (endDate) {
        query = query.lte('date', endDate)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data
    }
  })
}

export function useUpdateShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ShiftUpdateData }) => {
      const { data: updatedShift, error } = await supabase
        .from('individual_shifts')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return updatedShift
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHIFTS_KEY] })
    }
  })
}

export function useShiftEvents() {
  const { data: shifts, ...rest } = useShifts()

  const events: ShiftEvent[] = shifts?.map(shift => ({
    id: shift.id,
    title: `${shift.employee?.first_name} ${shift.employee?.last_name}`,
    start: new Date(shift.date + 'T' + shift.shift_option.start_time),
    end: new Date(shift.date + 'T' + shift.shift_option.end_time),
    employee_id: shift.employee_id,
    is_supervisor: shift.employee?.role === 'supervisor',
    status: shift.status,
    actual_start_time: shift.actual_start_time,
    actual_end_time: shift.actual_end_time,
    notes: shift.notes
  })) ?? []

  return {
    events,
    ...rest
  }
} 