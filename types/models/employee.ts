import type { Database } from '../supabase/database'
import type { ValidationResult } from '../validation'

type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

/**
 * Base employee type from database with additional fields
 */
export interface Employee {
  id: string
  auth_id: string
  email: string
  employee_id: string
  first_name: string
  last_name: string
  role: EmployeeRole
  shift_pattern: ShiftPattern
  team_id?: string | null
  default_weekly_hours: number
  weekly_hours_cap: number
  max_overtime_hours: number
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
  preferred_shift_category?: string
  max_weekly_hours: number
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
  assignedShifts: Tables['assigned_shifts']['Row'][]
  timeOffRequests: Tables['time_off_requests']['Row'][]
}

/**
 * Employee with their schedule statistics
 */
export interface EmployeeWithStats extends Employee {
  totalHours: number
  overtimeHours: number
  regularHours: number
  scheduledDays: number
  consecutiveDays: number
  timeOffDays: number
}

/**
 * Employee schedule preferences
 */
export interface EmployeeSchedulePreferences {
  preferredShiftCategory: ShiftCategory
  preferredDaysOff: number[]  // 0-6, where 0 is Sunday
  maxConsecutiveDays: number
  minRestHours: number
  overtimePreference: boolean
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
  timeOffRequests: Tables['time_off_requests']['Row'][]
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
export type CreateEmployeeInput = Omit<
  Employee,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
>

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
  shiftPatterns?: ShiftPattern[]
  preferredShiftCategory?: ShiftCategory
  minWeeklyHours?: number
  maxWeeklyHours?: number
  searchTerm?: string
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