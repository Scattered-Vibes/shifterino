import type { Database } from '@/types/supabase/database'
import type { EmployeeBasic } from './employee'

// Database types
type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

// Base types from database
export type Schedule = Tables['schedule_periods']['Row']
export type StaffingRequirement = Tables['staffing_requirements']['Row']
export type ShiftOption = Tables['shift_options']['Row']

// Extended types with relationships
export interface ScheduleWithDetails extends Schedule {
  employee: EmployeeBasic
}

// Create/Update types
export type ScheduleCreate = Omit<Schedule, 'id' | 'created_at' | 'updated_at'> & {
  start_date: string
  end_date: string
  created_by: string
}

export type ScheduleUpdate = Partial<ScheduleCreate>

// Additional types for schedule management
export interface StaffingGap {
  time_block_start: string
  time_block_end: string
  required_count: number
  actual_count: number
  missing_supervisor: boolean
}

export interface ScheduleTemplate {
  id: string
  name: string
  description?: string
  shift_patterns: {
    [key: string]: {
      category: string
      time_block_start: string
      time_block_end: string
      min_total_staff: number
      min_supervisors: number
    }[]
  }
  created_at: string
  updated_at: string
} 