import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { shiftQueries } from '@/lib/supabase/data-access/shifts'
import type { Shift, ShiftEvent, ShiftUpdateData } from '@/types/shift'
import { toast } from '@/components/ui/use-toast'
import { ErrorCode, handleError, getUserFriendlyMessage } from '@/lib/utils/error-handler'

interface UseShiftsOptions {
  startDate?: Date
  endDate?: Date
  employeeId?: string
  includeEmployee?: boolean
}

export function useShifts(options: UseShiftsOptions = {}) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const {
    data: shifts,
    isLoading,
    error,
    refetch
  } = useQuery<Shift[], Error>({
    queryKey: ['shifts', options],
    queryFn: async () => {
      const { data, error } = await shiftQueries.getShifts(options)
      if (error) throw error
      return data || []
    }
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
    mutationFn: async ({ shiftId, updateData }: { shiftId: string; updateData: ShiftUpdateData }) => {
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

  const transformToEvents = (shifts: Shift[] = []): ShiftEvent[] => {
    try {
      return shifts
        .filter((shift): shift is (Shift & { actual_start_time: string; actual_end_time: string }) =>
          shift.actual_start_time !== null && shift.actual_end_time !== null
        )
        .map(shift => ({
          id: shift.id,
          title: shift.employee_id,
          start: shift.actual_start_time,
          end: shift.actual_end_time,
          extendedProps: {
            shiftOptionId: shift.shift_option_id,
            employeeId: shift.employee_id
          }
        }))
    } catch (error) {
      const appError = handleError(error)
      console.error('Error transforming shifts to events:', appError)
      return []
    }
  }

  const updateShift = async (shiftId: string, updateData: ShiftUpdateData) => {
    await updateShiftMutation.mutateAsync({ shiftId, updateData })
  }

  return {
    shifts,
    events: transformToEvents(shifts),
    isLoading,
    error,
    updateShift,
    refetch
  }
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
    mutationFn: async (shift: Omit<Shift, 'id' | 'created_at' | 'updated_at'>) => {
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