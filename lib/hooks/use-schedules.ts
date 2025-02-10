import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { scheduleQueries } from '@/lib/supabase/data-access/schedules'
import { toast } from '@/components/ui/use-toast'
import { ErrorCode, handleError, getUserFriendlyMessage } from '@/lib/utils/error-handler'

type QueryOptions = Parameters<typeof scheduleQueries.searchSchedules>[0]

export function useSchedules(options: QueryOptions = {}) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const {
    data: schedules,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['schedules', options],
    queryFn: async () => {
      const { data, error } = await scheduleQueries.searchSchedules(options)
      if (error) throw error
      return data
    }
  })

  useEffect(() => {
    const channel = supabase
      .channel('schedules')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules'
        },
        (_payload) => {
          try {
            queryClient.invalidateQueries({ queryKey: ['schedules'] })
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

  return {
    schedules,
    isLoading,
    error,
    refetch
  }
}

export function useSchedule(scheduleId: string) {
  const {
    data: schedule,
    isLoading,
    error
  } = useQuery({
    queryKey: ['schedule', scheduleId],
    queryFn: async () => {
      const { data, error } = await scheduleQueries.getSchedule(scheduleId)
      if (error) throw error
      return data
    },
    enabled: !!scheduleId
  })

  return {
    schedule,
    isLoading,
    error
  }
}

export function useCreateSchedule() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: Parameters<typeof scheduleQueries.createSchedule>[0]) => {
      const { data: newSchedule, error } = await scheduleQueries.createSchedule(data)
      if (error) throw error
      return newSchedule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      toast({
        title: 'Success',
        description: 'Schedule created successfully',
        variant: 'default'
      })
    },
    onError: (error) => {
      const appError = handleError(error)
      toast({
        title: 'Error Creating Schedule',
        description: getUserFriendlyMessage(appError.code),
        variant: 'destructive'
      })
    }
  })

  return mutation
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({
      scheduleId,
      data
    }: {
      scheduleId: string
      data: Parameters<typeof scheduleQueries.updateSchedule>[1]
    }) => {
      const { data: updatedSchedule, error } = await scheduleQueries.updateSchedule(scheduleId, data)
      if (error) throw error
      return updatedSchedule
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      queryClient.invalidateQueries({ queryKey: ['schedule', variables.scheduleId] })
      toast({
        title: 'Success',
        description: 'Schedule updated successfully',
        variant: 'default'
      })
    },
    onError: (error) => {
      const appError = handleError(error)
      toast({
        title: 'Error Updating Schedule',
        description: getUserFriendlyMessage(appError.code),
        variant: 'destructive'
      })
    }
  })

  return mutation
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await scheduleQueries.deleteSchedule(scheduleId)
      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      toast({
        title: 'Success',
        description: 'Schedule deleted successfully',
        variant: 'default'
      })
    },
    onError: (error) => {
      const appError = handleError(error)
      toast({
        title: 'Error Deleting Schedule',
        description: getUserFriendlyMessage(appError.code),
        variant: 'destructive'
      })
    }
  })

  return mutation
}

export function useScheduleShifts(scheduleId: string) {
  const {
    data: shifts,
    isLoading,
    error
  } = useQuery({
    queryKey: ['schedule-shifts', scheduleId],
    queryFn: async () => {
      const { data, error } = await scheduleQueries.getScheduleShifts(scheduleId)
      if (error) throw error
      return data
    },
    enabled: !!scheduleId
  })

  return {
    shifts,
    isLoading,
    error
  }
}

export function useScheduleConflicts(employeeId: string, startDate: Date, endDate: Date) {
  const {
    data: conflicts,
    isLoading,
    error
  } = useQuery({
    queryKey: ['schedule-conflicts', employeeId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await scheduleQueries.getScheduleConflicts(employeeId, startDate, endDate)
      if (error) throw error
      return data
    },
    enabled: !!employeeId && !!startDate && !!endDate
  })

  return {
    conflicts,
    isLoading,
    error
  }
} 