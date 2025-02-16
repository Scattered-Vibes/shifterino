'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSupabase } from '@/app/providers/SupabaseContext'
import { toast } from '@/components/ui/use-toast'
import { ErrorCode, handleError, getUserFriendlyMessage } from '@/lib/utils/error-handler'
import type { Database } from '@/types/supabase/database'
import * as timeOffServer from '../server/use-time-off'

type TimeOffRequest = Database['public']['Tables']['time_off_requests']['Row']
type QueryOptions = Parameters<typeof timeOffServer.getTimeOffRequests>[0]

export function useTimeOffRequests(options: QueryOptions = {}) {
  const queryClient = useQueryClient()
  const { supabase } = useSupabase()

  const {
    data: requests,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['time-off-requests', options],
    queryFn: () => timeOffServer.getTimeOffRequests(options)
  })

  useEffect(() => {
    const channel = supabase
      .channel('time-off-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_off_requests'
        },
        (_payload) => {
          try {
            queryClient.invalidateQueries({ queryKey: ['time-off-requests'] })
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
    requests,
    isLoading,
    error,
    refetch
  }
}

export function useTimeOffRequest(requestId: string) {
  const {
    data: request,
    isLoading,
    error
  } = useQuery({
    queryKey: ['time-off-request', requestId],
    queryFn: () => timeOffServer.getTimeOffRequest(requestId),
    enabled: !!requestId
  })

  return {
    request,
    isLoading,
    error
  }
}

export function useCreateTimeOffRequest() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof timeOffServer.createTimeOffRequest>[0]) => {
      return timeOffServer.createTimeOffRequest(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] })
      toast({
        title: 'Success',
        description: 'Time-off request created successfully',
        variant: 'default'
      })
    },
    onError: (error) => {
      const appError = handleError(error)
      toast({
        title: 'Error Creating Time-off Request',
        description: getUserFriendlyMessage(appError.code),
        variant: 'destructive'
      })
    }
  })

  return mutation
}

export function useUpdateTimeOffRequest() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({
      requestId,
      data
    }: {
      requestId: string
      data: Parameters<typeof timeOffServer.updateTimeOffRequest>[1]
    }) => {
      return timeOffServer.updateTimeOffRequest(requestId, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] })
      queryClient.invalidateQueries({ queryKey: ['time-off-request', variables.requestId] })
      toast({
        title: 'Success',
        description: 'Time-off request updated successfully',
        variant: 'default'
      })
    },
    onError: (error) => {
      const appError = handleError(error)
      toast({
        title: 'Error Updating Time-off Request',
        description: getUserFriendlyMessage(appError.code),
        variant: 'destructive'
      })
    }
  })

  return mutation
}

export function useDeleteTimeOffRequest() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (requestId: string) => {
      return timeOffServer.deleteTimeOffRequest(requestId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] })
      toast({
        title: 'Success',
        description: 'Time-off request deleted successfully',
        variant: 'default'
      })
    },
    onError: (error) => {
      const appError = handleError(error)
      toast({
        title: 'Error Deleting Time-off Request',
        description: getUserFriendlyMessage(appError.code),
        variant: 'destructive'
      })
    }
  })

  return mutation
}

export function useApproveTimeOffRequest() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (requestId: string) => {
      return timeOffServer.approveTimeOffRequest(requestId)
    },
    onSuccess: (_, requestId) => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] })
      queryClient.invalidateQueries({ queryKey: ['time-off-request', requestId] })
      toast({
        title: 'Success',
        description: 'Time-off request approved successfully',
        variant: 'default'
      })
    },
    onError: (error) => {
      const appError = handleError(error)
      toast({
        title: 'Error Approving Time-off Request',
        description: getUserFriendlyMessage(appError.code),
        variant: 'destructive'
      })
    }
  })

  return mutation
}

export function useRejectTimeOffRequest() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason: string }) => {
      return timeOffServer.rejectTimeOffRequest(requestId, reason)
    },
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] })
      queryClient.invalidateQueries({ queryKey: ['time-off-request', requestId] })
      toast({
        title: 'Success',
        description: 'Time-off request rejected successfully',
        variant: 'default'
      })
    },
    onError: (error) => {
      const appError = handleError(error)
      toast({
        title: 'Error Rejecting Time-off Request',
        description: getUserFriendlyMessage(appError.code),
        variant: 'destructive'
      })
    }
  })

  return mutation
}

export function useTimeOffConflicts(employeeId: string, startDate: Date, endDate: Date) {
  const {
    data: conflicts,
    isLoading,
    error
  } = useQuery({
    queryKey: ['time-off-conflicts', employeeId, startDate, endDate],
    queryFn: () => timeOffServer.getTimeOffConflicts(employeeId, startDate, endDate),
    enabled: !!employeeId && !!startDate && !!endDate
  })

  return {
    conflicts,
    isLoading,
    error
  }
} 