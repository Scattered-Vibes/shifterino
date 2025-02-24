import type { Database } from '@/types/supabase/database'
import type { BaseModel } from '@/types/models/base'
import { Shift, ShiftWithEmployee, isShift, isShiftWithEmployee } from './shift'

// Database types
type Tables = Database['public']['Tables']
type SchedulePeriodRow = Tables['schedule_periods']['Row']
type StaffingRequirementRow = Tables['staffing_requirements']['Row']

// Shift category type from database enum
export type ShiftCategory = Database['public']['Enums']['shift_category']

// Schedule status type from database enum
export type ScheduleStatus = Database['public']['Enums']['schedule_status']

// Base schedule interface
export interface Schedule extends BaseModel {
  description?: string
  start_date: string
  end_date: string
  status: ScheduleStatus
  shifts?: Shift[]
  requirements?: StaffingRequirement[]
}

// Schedule with shifts
export interface ScheduleWithShifts extends Schedule {
  shifts: Shift[]
}

// Schedule with shifts and employees
export interface ScheduleWithDetails extends Schedule {
  shifts: ShiftWithEmployee[]
  requirements: StaffingRequirement[]
}

// Staffing requirement interface
export interface StaffingRequirement extends BaseModel {
  name: string
  day_of_week: number
  time_block_start: string
  time_block_end: string
  min_total_staff: number
  min_supervisors: number
  is_holiday?: boolean
  schedule_period_id?: string
  override_reason?: string
}

// Schedule generation parameters
export interface ScheduleGenerationParams {
  start_date: string
  end_date: string
  department_ids?: string[]
  role_ids?: string[]
  employee_ids?: string[]
  preferences?: {
    max_consecutive_days?: number
    min_rest_hours?: number
    prefer_consistent_shifts?: boolean
  }
}

// Schedule generation result
export interface ScheduleGenerationResult {
  schedule: Schedule
  shifts: Shift[]
  warnings: string[]
  errors: string[]
  unassigned_requirements: StaffingRequirement[]
}

// Input types
export interface CreateScheduleInput {
  description?: string
  start_date: string
  end_date: string
  status?: ScheduleStatus
}

export interface UpdateScheduleInput {
  description?: string
  start_date?: string
  end_date?: string
  status?: ScheduleStatus
}

// Type guards
export function isSchedule(obj: any): obj is Schedule {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.start_date === 'string' &&
    typeof obj.end_date === 'string' &&
    typeof obj.status === 'string' &&
    (!obj.description || typeof obj.description === 'string') &&
    (!obj.shifts || Array.isArray(obj.shifts)) &&
    (!obj.requirements || Array.isArray(obj.requirements))
  )
}

export function isScheduleWithShifts(obj: any): obj is ScheduleWithShifts {
  return (
    isSchedule(obj) &&
    Array.isArray(obj.shifts) &&
    obj.shifts.every((shift: any) => isShift(shift))
  )
}

export function isScheduleWithDetails(obj: any): obj is ScheduleWithDetails {
  return (
    isSchedule(obj) &&
    Array.isArray(obj.shifts) &&
    obj.shifts.every((shift: any) => isShiftWithEmployee(shift)) &&
    Array.isArray(obj.requirements) &&
    obj.requirements.every((req: any) => isStaffingRequirement(req))
  )
}

export function isStaffingRequirement(obj: any): obj is StaffingRequirement {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.day_of_week === 'number' &&
    typeof obj.time_block_start === 'string' &&
    typeof obj.time_block_end === 'string' &&
    typeof obj.min_total_staff === 'number' &&
    typeof obj.min_supervisors === 'number' &&
    (!obj.is_holiday || typeof obj.is_holiday === 'boolean') &&
    (!obj.schedule_period_id || typeof obj.schedule_period_id === 'string') &&
    (!obj.override_reason || typeof obj.override_reason === 'string')
  )
}