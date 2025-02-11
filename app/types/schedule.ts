import { type Database } from './supabase/database'

export type TimeBlock = {
  start: Date
  end: Date
  required_total: number
  required_supervisors: number
  actual_total: number
  actual_supervisors: number
}

export type StaffingLevel = {
  total: number
  supervisors: number
  hasSupervisor: boolean
  isSufficient: boolean
}

export type SchedulePeriod = Database['public']['Tables']['schedule_periods']['Row']

export type StaffingRequirement = Database['public']['Tables']['staffing_requirements']['Row'] & {
  start_time: Date
  end_time: Date
  required_total: number
  required_supervisors: number
  actual_total: number
  actual_supervisors: number
} 