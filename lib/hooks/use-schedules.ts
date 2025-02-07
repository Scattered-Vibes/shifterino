import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'

export interface Schedule {
  id: string
  employee_id: string
  created_by: string
  updated_by: string
  start_date: string
  end_date: string
  shift_type: string
  shift_pattern: 'pattern_a' | 'pattern_b' | 'custom'
  is_supervisor: boolean
  status: string
  created_at: string
  updated_at: string
}

export async function getSchedules() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .order('start_date', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data as Schedule[]
}

export function useSchedules() {
  return useQuery({
    queryKey: ['schedules'],
    queryFn: getSchedules,
  })
} 