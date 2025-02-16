'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/app/providers/SupabaseContext'
import type { Database } from '@/types/supabase/database'
import { PostgrestError } from '@supabase/supabase-js'

type Employee = Database['public']['Tables']['employees']['Row']

export function useEmployees() {
  const { supabase } = useSupabase()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchEmployees = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .order('name')

      if (fetchError) {
        throw fetchError
      }

      setEmployees(data || [])
      return data
    } catch (err) {
      console.error('Error fetching employees:', err)
      const error = err instanceof PostgrestError ? err : new Error('Failed to fetch employees')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [supabase])

  return {
    employees,
    isLoading,
    error,
    refetch: fetchEmployees
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