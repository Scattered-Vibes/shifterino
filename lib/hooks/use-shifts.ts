import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'

export interface Shift {
  id: string
  name: string
  start_time: string
  end_time: string
  duration_hours: number
  is_overnight: boolean
  min_employees: number
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export async function getShifts() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('shift_options')
    .select('*')
    .order('start_time', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data as unknown as Shift[]
}

export function useShifts() {
  return useQuery({
    queryKey: ['shifts'],
    queryFn: getShifts,
  })
} 