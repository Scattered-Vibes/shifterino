import type { Database } from '../supabase/database'
import type { ValidationResult } from '../validation'
import { BaseModel } from './base'

type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

type EmployeeTable = Tables['employees']
type DBEmployee = EmployeeTable['Row']
type DBShiftAssignment = Tables['shift_assignments']['Row']
type DBTimeOffRequest = Tables['time_off_requests']['Row']

/**
 * Base employee type from database with additional fields
 */
export interface Employee extends BaseModel {
  user_id: string
  first_name: string
  last_name: string
  email: string
  role: 'dispatcher' | 'supervisor' | 'manager'
  shift_pattern: 'four_ten' | 'three_twelve_four'
  default_shift: string
  weekly_hours_cap: number
  max_overtime_hours: number
  is_active: boolean
}

/**
 * Employee role from database enum
 */
export type EmployeeRole = 'dispatcher' | 'supervisor' | 'manager'

/**
 * Shift category type
 */
export type ShiftCategory = 'early' | 'day' | 'swing' | 'graveyard'

/**
 * Shift pattern type from database enum
 */
export type ShiftPattern = '4x10' | '3x12_plus_4'

/**
 * Employee with their current schedule information
 */
export interface EmployeeWithSchedule extends Employee {
  shift_assignments: DBShiftAssignment[]
  time_off_requests: DBTimeOffRequest[]
}

/**
 * Employee with their schedule statistics
 */
export interface EmployeeWithStats extends Employee {
  total_hours: number
  overtime_hours: number
  regular_hours: number
  scheduled_days: number
  consecutive_days: number
  time_off_days: number
}

/**
 * Employee schedule preferences
 */
export interface EmployeeSchedulePreferences {
  preferred_shift_category: ShiftCategory
  preferred_days_off: number[]  // 0-6, where 0 is Sunday
  max_consecutive_days: number
  min_rest_hours: number
  overtime_preference: boolean
}

/**
 * Employee availability for a specific date range
 */
export interface EmployeeAvailability {
  employeeId: string
  startDate: string  // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
  availableTimeBlocks: {
    dayOfWeek: number  // 0-6
    startTime: string  // HH:mm
    endTime: string    // HH:mm
  }[]
  timeOffRequests: DBTimeOffRequest[]
}

/**
 * Fields that can be used to sort employees
 */
export type EmployeeSortField = keyof Pick<
  Employee,
  | 'first_name'
  | 'last_name'
  | 'role'
  | 'shift_pattern'
  | 'weekly_hours_cap'
  | 'created_at'
  | 'updated_at'
>

/**
 * Input type for creating a new employee
 */
export type CreateEmployeeInput = Omit<Employee, keyof BaseModel>

/**
 * Input type for updating an existing employee
 */
export type UpdateEmployeeInput = Partial<CreateEmployeeInput>

/**
 * Result of employee validation
 */
export interface EmployeeValidationResult extends ValidationResult {
  employee: Employee
  scheduleConflicts: {
    date: string
    type: 'OVERTIME' | 'PATTERN_VIOLATION' | 'REST_PERIOD'
    message: string
  }[]
}

/**
 * Employee sort configuration
 */
export interface EmployeeSort {
  field: EmployeeSortField
  direction: 'asc' | 'desc'
}

/**
 * Employee filter options
 */
export interface EmployeeFilters {
  roles?: EmployeeRole[]
  shift_patterns?: ShiftPattern[]
  preferred_shift_category?: ShiftCategory
  min_weekly_hours?: number
  max_weekly_hours?: number
  search_term?: string
}

/**
 * Employee with time off information
 */
export interface EmployeeWithTimeOff extends Employee {
  time_off_requests: Tables['time_off_requests']['Row'][]
  upcoming_time_off: Tables['time_off_requests']['Row'][]
}

// Utility Types
export interface EmployeeSchedulePreferences {
  preferred_days: string[]
  preferred_shifts: string[]
  max_consecutive_shifts: number
  min_hours_between_shifts: number
}

export interface EmployeeAvailability {
  employee_id: string
  date: string
  is_available: boolean
  reason?: string
}

export type UserRole = 'dispatcher' | 'supervisor' | 'manager'

// Type for the Supabase employees table
export type EmployeeRow = Database['public']['Tables']['employees']['Row']

// Type for inserting a new employee
export type EmployeeInsert = Database['public']['Tables']['employees']['Insert']

// Type for updating an employee
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update']

export interface EmployeeShift {
  id: string
  start_time: string
  end_time: string
  is_supervisor: boolean
}

export interface EmployeeWithShifts extends Employee {
  shifts: EmployeeShift[]
}

// Type guards
export function isEmployee(value: unknown): value is Employee {
  if (!value || typeof value !== 'object') return false
  
  return (
    'id' in value &&
    'user_id' in value &&
    'first_name' in value &&
    'last_name' in value &&
    'email' in value &&
    'role' in value &&
    'shift_pattern' in value &&
    'default_shift' in value &&
    'weekly_hours_cap' in value &&
    'max_overtime_hours' in value &&
    'is_active' in value
  )
}

export function isEmployeeWithShifts(value: unknown): value is EmployeeWithShifts {
  return isEmployee(value) && 'shifts' in value && Array.isArray((value as any).shifts)
} 