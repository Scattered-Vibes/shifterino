import type { Database } from '../supabase/database'
import type { Employee } from './employee'
import type { IndividualShift, ShiftPattern } from './shift'

type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

// Base Types
export type Schedule = Tables['schedules']['Row']
export type ScheduleInsert = Tables['schedules']['Insert']
export type ScheduleUpdate = Tables['schedules']['Update']

export type SchedulePeriod = Tables['schedule_periods']['Row']
export type SchedulePeriodInsert = Tables['schedule_periods']['Insert']
export type SchedulePeriodUpdate = Tables['schedule_periods']['Update']

// Extended Types
export interface ScheduleWithDetails extends Schedule {
  employee: Employee
  shifts: IndividualShift[]
}

export interface SchedulePeriodWithDetails extends SchedulePeriod {
  schedules: Schedule[]
  shifts: IndividualShift[]
  staffing_requirements: Tables['staffing_requirements']['Row'][]
}

// Create Types
export interface CreateScheduleInput {
  employee_id: string
  start_date: string
  end_date: string
  shift_pattern: ShiftPattern
  shift_type: string
  is_supervisor?: boolean
}

export interface CreateSchedulePeriodInput {
  start_date: string
  end_date: string
  description?: string
  is_active?: boolean
}

// Update Types
export type UpdateScheduleInput = Partial<CreateScheduleInput>
export type UpdateSchedulePeriodInput = Partial<CreateSchedulePeriodInput>

// Filter Types
export interface ScheduleFilters {
  start_date?: string
  end_date?: string
  employee_id?: string
  shift_pattern?: ShiftPattern
  is_supervisor?: boolean
}

export interface SchedulePeriodFilters {
  start_date?: string
  end_date?: string
  is_active?: boolean
}

// Sort Types
export type ScheduleSortField = 
  | 'start_date'
  | 'end_date'
  | 'employee_name'
  | 'shift_pattern'
  | 'created_at'

export interface ScheduleSort {
  field: ScheduleSortField
  direction: 'asc' | 'desc'
}

// Utility Types
export interface ScheduleValidation {
  is_valid: boolean
  errors: {
    type: 'staffing' | 'pattern' | 'overtime' | 'availability'
    message: string
    date?: string
  }[]
}

export interface ScheduleStatistics {
  total_shifts: number
  total_hours: number
  overtime_hours: number
  supervisor_coverage: number
  staffing_requirements_met: number
  pattern_adherence: number
}