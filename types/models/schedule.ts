import type { Database } from '../supabase/database'
import type { ValidationResult } from '../validation'
import type { ShiftPattern } from '../shift-patterns'
import type { Employee } from './employee'
import type { Shift, AssignedShift } from './shift'

type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

/**
 * Schedule status type
 */
export type ScheduleStatus = 'draft' | 'published' | 'archived'

/**
 * Base schedule type from database
 */
export type Schedule = {
  id: string
  name: string // This field does not exist in the schedule_periods table
  start_date: string
  end_date: string
  status: ScheduleStatus
  description: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Schedule with additional computed fields
 */
export interface ScheduleWithDetails extends Schedule {
  employees: Employee[]
  assignedShifts: (AssignedShift & {
    employee: Employee
    shift: Shift
  })[]
  totalHours: number
  totalAssignments: number
  coverageStats: {
    totalRequired: number
    totalAssigned: number
    coveragePercentage: number
  }
}

/**
 * Schedule validation result
 */
export interface ScheduleValidationResult extends ValidationResult {
  schedule: Schedule
  conflicts: {
    type: 'COVERAGE' | 'PATTERN' | 'HOURS' | 'TIME_OFF'
    message: string
    date?: string
    employeeId?: string
    shiftId?: string
  }[]
}

/**
 * Input for creating a new schedule
 */
export type CreateScheduleInput = Omit<
  Schedule,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
>

/**
 * Input for updating an existing schedule
 */
export type UpdateScheduleInput = Partial<CreateScheduleInput>

/**
 * Schedule filter options
 */
export interface ScheduleFilters {
  start_date?: string
  end_date?: string
  status?: Schedule['status']
  employeeId?: string
  searchTerm?: string
}

/**
 * Fields that can be used to sort schedules
 */
export type ScheduleSortField = keyof Pick<
  Schedule,
  'name' | 'start_date' | 'end_date' | 'status' | 'created_at' | 'updated_at'
>

/**
 * Schedule sort configuration
 */
export interface ScheduleSort {
  field: ScheduleSortField
  direction: 'asc' | 'desc'
}

/**
 * Schedule generation options
 */
export interface ScheduleGenerationOptions {
  start_date: string
  end_date: string
  employeeIds: string[]
  shiftPatterns: {
    employeeId: string
    pattern: ShiftPattern
  }[]
  preferences?: {
    employeeId: string
    preferredShifts: string[]
    avoidShifts: string[]
  }[]
  constraints?: {
    maxConsecutiveDays?: number
    minRestHours?: number
    maxOvertimeHours?: number
  }
}