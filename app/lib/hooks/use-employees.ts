import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { employeeQueries } from '@/lib/supabase/data-access/employees'
import { toast } from '@/components/ui/use-toast'
import { ErrorCode, handleError, getUserFriendlyMessage } from '@/lib/utils/error-handler'
import type { Database } from '@/types/supabase/database'

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
  const supabase = createClient()

  const {
    data: employees,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['employees', options],
    queryFn: async () => {
      const { data, error } = await employeeQueries.searchEmployees(options)
      if (error) throw error
      return data
    }
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
    queryFn: async () => {
      const { data, error } = await employeeQueries.getEmployee(employeeId)
      if (error) throw error
      return data
    },
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
      const { data: updatedEmployee, error } = await employeeQueries.updateEmployee(employeeId, data)
      if (error) throw error
      return updatedEmployee
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
    queryFn: async () => {
      const { data, error } = await employeeQueries.getEmployeeSchedules(employeeId, startDate, endDate)
      if (error) throw error
      return data
    },
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
    queryFn: async () => {
      const { data, error } = await employeeQueries.getEmployeeShifts(employeeId, startDate, endDate)
      if (error) throw error
      return data
    },
    enabled: !!employeeId
  })

  return {
    shifts,
    isLoading,
    error
  }
} 