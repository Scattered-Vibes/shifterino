import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'

export interface StaffingRequirement {
  id: string
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Sunday, 6 = Saturday
  start_time: string
  end_time: string
  min_total_staff: number
  min_supervisors: number
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export async function getStaffingRequirements() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('staffing_requirements')
    .select('*')
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data as unknown as StaffingRequirement[]
}

export function useStaffingRequirements() {
  return useQuery({
    queryKey: ['staffingRequirements'],
    queryFn: getStaffingRequirements,
  })
} 