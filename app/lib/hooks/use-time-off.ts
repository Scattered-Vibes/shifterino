import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { timeOffQueries } from '@/lib/supabase/data-access/time-off'
import { toast } from '@/components/ui/use-toast'
import { ErrorCode, handleError, getUserFriendlyMessage } from '@/lib/utils/error-handler'

type QueryOptions = Parameters<typeof timeOffQueries.searchTimeOffRequests>[0]

export function useTimeOffRequests(options: QueryOptions = {}) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const {
    data: requests,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['time-off-requests', options],
    queryFn: async () => {
      const { data, error } = await timeOffQueries.searchTimeOffRequests(options)
      if (error) throw error
      return data
    }
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
    queryFn: async () => {
      const { data, error } = await timeOffQueries.getTimeOffRequest(requestId)
      if (error) throw error
      return data
    },
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
    mutationFn: async (data: Parameters<typeof timeOffQueries.createTimeOffRequest>[0]) => {
      const { data: newRequest, error } = await timeOffQueries.createTimeOffRequest(data)
      if (error) throw error
      return newRequest
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
    mutationFn: async ({
      requestId,
      data
    }: {
      requestId: string
      data: Parameters<typeof timeOffQueries.updateTimeOffRequest>[1]
    }) => {
      const { data: updatedRequest, error } = await timeOffQueries.updateTimeOffRequest(requestId, data)
      if (error) throw error
      return updatedRequest
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
    mutationFn: async (requestId: string) => {
      const { error } = await timeOffQueries.deleteTimeOffRequest(requestId)
      if (error) throw error
      return true
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

export function useTimeOffConflicts(employeeId: string, startDate: Date, endDate: Date) {
  const {
    data: conflicts,
    isLoading,
    error
  } = useQuery({
    queryKey: ['time-off-conflicts', employeeId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await timeOffQueries.getTimeOffConflicts(employeeId, startDate, endDate)
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