import type { Database } from '@/app/types/supabase/database'
import type { IndividualShift, ShiftOption } from './shift'
import type { EmployeeBasic, Employee } from './employee'
import type { TimeBlock, ValidationResult, BaseConflict } from '../shared/common'

// Base schedule type from database
export type Schedule = Database['public']['Tables']['schedules']['Row']
export type SchedulePeriod = Database['public']['Tables']['schedule_periods']['Row']
export type StaffingRequirement = Database['public']['Tables']['staffing_requirements']['Row']
export type ShiftPatternRule = Database['public']['Tables']['shift_pattern_rules']['Row']

// Enums
export type ShiftPattern = Database['public']['Enums']['shift_pattern']

// Extended types with relationships
export interface ScheduleWithDetails extends Schedule {
  employee: EmployeeBasic
  shifts: IndividualShift[]
}

export interface SchedulePeriodWithDetails extends SchedulePeriod {
  schedules: ScheduleWithDetails[]
  staffing_requirements: StaffingRequirement[]
}

// Create/Update types
export type ScheduleCreate = Omit<Schedule, 'id' | 'created_at' | 'updated_at'> & {
  start_date: string
  end_date: string
  employee_id: string
  shift_pattern: ShiftPattern
  created_by: string
  updated_by: string
}

export type ScheduleUpdate = Partial<ScheduleCreate>

// Validation types
export interface ScheduleConflict extends BaseConflict {
  type: 'overlap' | 'pattern' | 'hours' | 'staffing'
  shifts?: IndividualShift[]
}

export interface ScheduleValidation extends ValidationResult {
  violations: PatternViolation[]
}

export interface PatternViolation extends BaseConflict {
  employee_id: string
  type: 'consecutive_shifts' | 'rest_period' | 'weekly_hours'
}

// Pattern tracking
export interface ShiftPatternTracking {
  [employeeId: string]: {
    consecutive_shifts: number
    last_shift_end: Date | null
  }
}

// Generation config
export interface ScheduleGenerationConfig {
  start_date: Date
  end_date: Date
  employees: Employee[]
  shift_options: ShiftOption[]
  staffing_requirements: StaffingRequirement[]
  existing_shifts?: IndividualShift[]
}

// Scheduling context types
export interface SchedulingContext {
  period: SchedulePeriod
  employees: EmployeeBasic[]
  existingShifts: IndividualShift[]
  shiftOptions: ShiftOption[]
  staffingRequirements: StaffingRequirement[]
}

// Extended schedule types
export interface ScheduleWithShifts extends Schedule {
  shifts: IndividualShift[]
}

export interface ScheduleWithEmployees extends Schedule {
  employees: Employee[]
}

export interface ScheduleStats {
  total_shifts: number
  total_hours: number
  employee_count: number
  unfilled_shifts: number
  supervisor_coverage: {
    [key: string]: boolean // key is time period, value is whether supervisor is scheduled
  }
}

// Additional types for schedule management
export interface StaffingGap {
  start_time: string
  end_time: string
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
      start_time: string
      end_time: string
      required_staff_count: number
      requires_supervisor: boolean
    }[]
  }
  created_at: string
  updated_at: string
} 