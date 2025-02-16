'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/app/providers/SupabaseContext'
import type { Database } from '@/types/supabase/database'
import type { PostgrestError } from '@supabase/supabase-js'

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