'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSupabase } from '@/app/providers/SupabaseContext'
import { toast } from '@/components/ui/use-toast'
import { ErrorCode, handleError, getUserFriendlyMessage } from '@/lib/utils/error-handler'
import type { Database } from '@/types/supabase/database'
import * as scheduleServer from '../server/use-schedules'

type SchedulePeriod = Database['public']['Tables']['schedule_periods']['Row']
type QueryOptions = Parameters<typeof scheduleServer.getSchedules>[0]

export function useSchedules(options: QueryOptions = {}) {
  const queryClient = useQueryClient()
  const { supabase } = useSupabase()

  const {
    data: schedules,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['schedules', options],
    queryFn: () => scheduleServer.getSchedules(options)
  })

  useEffect(() => {
    const channel = supabase
      .channel('schedule_periods')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedule_periods'
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
    queryFn: () => scheduleServer.getSchedule(scheduleId),
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
    mutationFn: (data: Parameters<typeof scheduleServer.createSchedule>[0]) => {
      return scheduleServer.createSchedule(data)
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
    mutationFn: ({
      scheduleId,
      data
    }: {
      scheduleId: string
      data: Parameters<typeof scheduleServer.updateSchedule>[1]
    }) => {
      return scheduleServer.updateSchedule(scheduleId, data)
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
    mutationFn: (scheduleId: string) => {
      return scheduleServer.deleteSchedule(scheduleId)
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
    queryFn: () => scheduleServer.getScheduleShifts(scheduleId),
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
    queryFn: () => scheduleServer.getScheduleConflicts(employeeId, startDate, endDate),
    enabled: !!employeeId && !!startDate && !!endDate
  })

  return {
    conflicts,
    isLoading,
    error
  }
} 