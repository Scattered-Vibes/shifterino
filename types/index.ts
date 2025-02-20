import type { Database } from './supabase/database'
import type {
  ValidationError,
  ValidationResult,
  SchedulingConflict,
  ConflictType,
  ConflictResolution,
  StaffingValidationResult
} from './validation'

// Re-export database types
export type { Database } from './supabase/database'

// Re-export validation types
export type {
  ValidationError,
  ValidationResult,
  SchedulingConflict,
  ConflictType,
  ConflictResolution,
  StaffingValidationResult
} from './validation'

// Common type aliases
export type ID = string
export type UUID = string
export type ISO8601DateTime = string

// Database type helpers
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']

// Utility types
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }
export type WithOptional<T, K extends keyof T> = Omit<T, K> & { [P in K]?: T[P] }
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Database table types
export type Employee = Tables['employees']['Row']
export type Shift = Tables['shifts']['Row']
export type StaffingRequirement = Tables['staffing_requirements']['Row']
export type AssignedShift = Tables['assigned_shifts']['Row']
export type TimeOffRequest = Tables['time_off_requests']['Row']

// Database enum types
export type EmployeeRole = Enums['employee_role']
export type ShiftPattern = Enums['shift_pattern']
export type TimeOffStatus = Enums['time_off_status']

// Re-export model types with additional functionality
export * from './models/employee'
export * from './models/shift'
export * from './models/schedule'
export * from './models/time-off'
export * from './models/staffing'