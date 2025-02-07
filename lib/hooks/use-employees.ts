import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'

export interface Employee {
  id: string
  auth_id: string
  first_name: string
  last_name: string
  email: string
  role: 'admin' | 'supervisor' | 'dispatcher'
  weekly_hours_cap: number
  consecutive_shifts_count: number | null
  last_shift_date: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export async function getEmployees() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('last_name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data as unknown as Employee[]
}

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  })
} 