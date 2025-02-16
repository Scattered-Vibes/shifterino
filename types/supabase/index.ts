import { Database as GeneratedDatabase } from './database'

export type Database = GeneratedDatabase

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Strongly typed tables
export type Employee = Tables<'employees'>
export type ShiftOption = Tables<'shift_options'>
export type IndividualShift = Tables<'individual_shifts'>
export type TimeOffRequest = Tables<'time_off_requests'>
export type AssignedShift = Tables<'assigned_shifts'>
export type StaffingRequirement = Tables<'staffing_requirements'>

// Strongly typed enums
export type EmployeeRole = Enums<'employee_role'>
export type ShiftStatus = Enums<'shift_status'>
export type TimeOffStatus = Enums<'time_off_status'>

// Helper types for common operations
export type EmployeeWithAuth = Employee & {
  auth_user?: {
    email: string
    role: EmployeeRole
  }
}

export type AssignedShiftWithEmployee = AssignedShift & {
  employee: Employee
  shift_option: ShiftOption
}

export type TimeOffRequestWithEmployee = TimeOffRequest & {
  employee: Employee
  reviewer?: Employee
}

// Database function return types
export type GetEmployeeResult = EmployeeWithAuth | null
export type GetAssignedShiftsResult = AssignedShiftWithEmployee[]
export type GetTimeOffRequestsResult = TimeOffRequestWithEmployee[]

// Validation types
export interface ValidationError {
  code: string
  message: string
  details?: unknown
}

export interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: ValidationError
} 