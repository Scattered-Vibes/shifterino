import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSupabase } from '@/app/providers/SupabaseContext'
import { toast } from '@/components/ui/use-toast'
import { ErrorCode, handleError, getUserFriendlyMessage } from '@/lib/utils/error-handler'
import type { Database } from '@/types/supabase/database'
import * as employeeServer from '../server/use-employees'

type Employee = Database['public']['Tables']['employees']['Row']

interface UseEmployeesOptions {
  page?: number
  limit?: number
  search?: {
    column: string
    query: string
  }
}

export function useEmployees(options: UseEmployeesOptions = {}) {
  const queryClient = useQueryClient()
  const { supabase } = useSupabase()

  const {
    data: employees,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['employees', options],
    queryFn: () => employeeServer.getEmployees(options)
  })

  useEffect(() => {
    const channel = supabase
      .channel('employees')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employees'
        },
        (_payload) => {
          try {
            queryClient.invalidateQueries({ queryKey: ['employees'] })
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
    employees,
    isLoading,
    error,
    refetch
  }
}

export function useEmployee(employeeId: string) {
  const {
    data: employee,
    isLoading,
    error
  } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeeServer.getEmployee(employeeId),
    enabled: !!employeeId
  })

  return {
    employee,
    isLoading,
    error
  }
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({
      employeeId,
      data
    }: {
      employeeId: string
      data: Partial<Employee>
    }) => {
      return employeeServer.updateEmployee(employeeId, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] })
      toast({
        title: 'Success',
        description: 'Employee updated successfully',
        variant: 'default'
      })
    },
    onError: (error) => {
      const appError = handleError(error)
      toast({
        title: 'Error Updating Employee',
        description: getUserFriendlyMessage(appError.code),
        variant: 'destructive'
      })
    }
  })

  return mutation
}

export function useEmployeeSchedules(employeeId: string, startDate?: Date, endDate?: Date) {
  const {
    data: schedules,
    isLoading,
    error
  } = useQuery({
    queryKey: ['employee-schedules', employeeId, startDate, endDate],
    queryFn: () => employeeServer.getEmployeeSchedules(employeeId, startDate, endDate),
    enabled: !!employeeId
  })

  return {
    schedules,
    isLoading,
    error
  }
}

export function useEmployeeShifts(employeeId: string, startDate?: Date, endDate?: Date) {
  const {
    data: shifts,
    isLoading,
    error
  } = useQuery({
    queryKey: ['employee-shifts', employeeId, startDate, endDate],
    queryFn: () => employeeServer.getEmployeeShifts(employeeId, startDate, endDate),
    enabled: !!employeeId
  })

  return {
    shifts,
    isLoading,
    error
  }
} 