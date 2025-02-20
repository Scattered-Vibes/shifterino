'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSupabase } from '@/app/providers/SupabaseContext'
import { toast } from '@/components/ui/use-toast'
import { ErrorCode, handleError, getUserFriendlyMessage } from '@/lib/utils/error-handler'
import type { Database } from '@/types/supabase/database'
import * as shiftServer from '../server/use-shifts'

type AssignedShift = Database['public']['Tables']['assigned_shifts']['Row']
type QueryOptions = Parameters<typeof shiftServer.getShifts>[0]

interface ShiftEvent {
  id: string
  title: string
  start: string
  end: string
  employeeId: string
  status: AssignedShift['status']
  extendedProps: {
    employeeId: string
    shiftType: string
    status: AssignedShift['status']
  }
}

export function useShifts(options: QueryOptions = {}) {
  const queryClient = useQueryClient()
  const { supabase } = useSupabase()

  const {
    data: shifts,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['shifts', options],
    queryFn: () => shiftServer.getShifts(options)
  })

  useEffect(() => {
    const channel = supabase
      .channel('assigned_shifts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assigned_shifts'
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

  const events = shifts ? transformToEvents(shifts) : []

  return {
    shifts,
    events,
    isLoading,
    error,
    refetch
  }
}

function transformToEvents(shifts: AssignedShift[]): ShiftEvent[] {
  return shifts.map((shift) => ({
    id: shift.id,
    title: `${shift.employee_id} - ${shift.shift_option_id}`,
    start: shift.date,
    end: shift.date,
    employeeId: shift.employee_id,
    status: shift.status,
    extendedProps: {
      employeeId: shift.employee_id,
      shiftType: shift.shift_option_id,
      status: shift.status,
    },
  }))
}

export function useShift(shiftId: string) {
  const {
    data: shift,
    isLoading,
    error
  } = useQuery({
    queryKey: ['shift', shiftId],
    queryFn: () => shiftServer.getShift(shiftId),
    enabled: !!shiftId
  })

  return {
    shift,
    isLoading,
    error
  }
}

export function useUpdateShift() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({
      shiftId,
      data
    }: {
      shiftId: string
      data: Parameters<typeof shiftServer.updateShift>[1]
    }) => {
      return shiftServer.updateShift(shiftId, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      queryClient.invalidateQueries({ queryKey: ['shift', variables.shiftId] })
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
    }
  })

  return mutation
}

export function useDeleteShift() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (shiftId: string) => {
      return shiftServer.deleteShift(shiftId)
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

export function useShiftConflicts(params: Parameters<typeof shiftServer.getShiftConflicts>[0]) {
  const {
    data: conflicts,
    isLoading,
    error
  } = useQuery({
    queryKey: ['shift-conflicts', params],
    queryFn: () => shiftServer.getShiftConflicts(params),
    enabled: !!params.employeeId && !!params.startTime && !!params.endTime
  })

  return {
    conflicts,
    isLoading,
    error
  }
}