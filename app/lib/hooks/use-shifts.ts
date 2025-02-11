import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { shiftQueries } from '@/lib/supabase/data-access/shifts'
import type { IndividualShift, ShiftEvent, ShiftUpdate } from '@/types/models/shift'
import { toast } from '@/components/ui/use-toast'
import { ErrorCode, handleError, getUserFriendlyMessage } from '@/lib/utils/error-handler'

interface UseShiftsOptions {
  scheduleId?: string
  employeeId?: string
  startDate?: string
  endDate?: string
}

interface UseShiftsResult {
  shifts: IndividualShift[]
  events: ShiftEvent[]
  isLoading: boolean
  error: Error | null
  updateShift: (shiftId: string, updateData: ShiftUpdate) => Promise<void>
}

export function useShifts(options: UseShiftsOptions): UseShiftsResult {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const {
    data: shifts = [],
    isLoading,
    error,
  } = useQuery<IndividualShift[]>({
    queryKey: ['shifts', options],
    queryFn: async () => {
      try {
        const { data, error } = await shiftQueries.searchShifts(options)
        if (error) {
          throw {
            code: ErrorCode.DB_QUERY_ERROR,
            message: 'Failed to fetch shifts',
            description: getUserFriendlyMessage(ErrorCode.DB_QUERY_ERROR),
            details: error,
          }
        }
        return data || []
      } catch (err) {
        console.error('Error fetching shifts:', err)
        throw err
      }
    },
  })

  useEffect(() => {
    const channel = supabase
      .channel('individual_shifts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'individual_shifts'
        },
        (_payload) => {
          try {
            queryClient.invalidateQueries({ queryKey: ['shifts'] })
          } catch (error) {
            const appError = handleError(error)
            toast({
              title: 'Real-time Update Error',
              description: getUserFriendlyMessage(ErrorCode.DB_QUERY_ERROR),
              variant: 'destructive'
            })
            console.error('Real-time subscription error:', appError)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel).catch(error => {
        console.error('Error removing channel:', error)
      })
    }
  }, [queryClient, supabase])

  const updateShiftMutation = useMutation({
    mutationFn: async ({ shiftId, updateData }: { shiftId: string; updateData: ShiftUpdate }) => {
      const { data, error } = await shiftQueries.updateShift(shiftId, updateData)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      toast({
        title: 'Success',
        description: 'Shift updated successfully',
        variant: 'default'
      })
    },
    onError: (error) => {
      const appError = handleError(error)
      toast({
        title: 'Error Updating Shift',
        description: getUserFriendlyMessage(appError.code),
        variant: 'destructive'
      })
      throw appError
    }
  })

  const events = transformToEvents(shifts)

  const updateShift = async (shiftId: string, updateData: ShiftUpdate) => {
    await updateShiftMutation.mutateAsync({ shiftId, updateData })
  }

  return {
    shifts,
    events,
    isLoading,
    error,
    updateShift,
  }
}

function transformToEvents(shifts: IndividualShift[]): ShiftEvent[] {
  return shifts.map((shift) => {
    const { start_time, end_time, ...rest } = shift
    return {
      ...rest,
      title: `${shift.employee_id} - ${shift.shift_type}`,
      start: start_time,
      end: end_time,
      allDay: false,
      extendedProps: {
        employeeId: shift.employee_id,
        shiftType: shift.shift_type,
        status: shift.status,
      },
    }
  })
}

export function useShift(shiftId: string) {
  const {
    data: shift,
    isLoading,
    error
  } = useQuery({
    queryKey: ['shift', shiftId],
    queryFn: async () => {
      const { data, error } = await shiftQueries.getShiftById(shiftId)
      if (error) throw error
      return data
    },
    enabled: !!shiftId
  })

  return {
    shift,
    isLoading,
    error
  }
}

export function useCreateShift() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (shift: Omit<IndividualShift, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await shiftQueries.createShift(shift)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      toast({
        title: 'Success',
        description: 'Shift created successfully',
        variant: 'default'
      })
    },
    onError: (error) => {
      const appError = handleError(error)
      toast({
        title: 'Error Creating Shift',
        description: getUserFriendlyMessage(appError.code),
        variant: 'destructive'
      })
    }
  })

  return mutation
}

export function useDeleteShift() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (shiftId: string) => {
      const { error } = await shiftQueries.deleteShift(shiftId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      toast({
        title: 'Success',
        description: 'Shift deleted successfully',
        variant: 'default'
      })
    },
    onError: (error) => {
      const appError = handleError(error)
      toast({
        title: 'Error Deleting Shift',
        description: getUserFriendlyMessage(appError.code),
        variant: 'destructive'
      })
    }
  })

  return mutation
}

export function useShiftConflicts(params: {
  employeeId: string
  startTime: Date
  endTime: Date
  excludeShiftId?: string
}) {
  const {
    data: conflicts,
    isLoading,
    error
  } = useQuery({
    queryKey: ['shift-conflicts', params],
    queryFn: async () => {
      const { data, error } = await shiftQueries.getShiftConflicts(params)
      if (error) throw error
      return data
    },
    enabled: !!params.employeeId && !!params.startTime && !!params.endTime
  })

  return {
    conflicts,
    isLoading,
    error
  }
} 