import type { Database } from '@/types/supabase/database'

type Tables = Database['public']['Tables']
export type Schedule = {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  status: 'draft' | 'published' | 'archived'
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

export type ScheduleStatus = Schedule['status']

export interface ScheduleWithDetails extends Schedule {
  shifts: Tables['individual_shifts']['Row'][]
  created_by_user: Tables['employees']['Row']
  updated_by_user: Tables['employees']['Row']
}

export interface ScheduleUpdateData {
  name?: string
  description?: string
  start_date?: string
  end_date?: string
  status?: ScheduleStatus
}

export interface GetSchedulesOptions {
  status?: ScheduleStatus
  startDate?: string
  endDate?: string
  includeShifts?: boolean
  includeUsers?: boolean
}

export interface StaffingRequirement {
  id: string
  schedule_id: string
  name: string
  day_of_week: number // 0-6 for Sunday-Saturday
  time_block_start: string // HH:mm format
  time_block_end: string // HH:mm format
  min_total_staff: number
  min_supervisors: number
  is_holiday: boolean | null
  override_reason: string | null
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
} 