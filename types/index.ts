import type { Database } from './supabase/database'

// Database Types
export type { Database } from './supabase/database'

// Common Types
export type ID = string
export type UUID = string
export type ISO8601DateTime = string

// Table Types
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']

// Employee Types
export type Employee = Tables['employees']['Row']
export type EmployeeInsert = Tables['employees']['Insert']
export type EmployeeUpdate = Tables['employees']['Update']
export type EmployeeRole = Enums['employee_role']

// Shift Types
export type IndividualShift = Tables['individual_shifts']['Row']
export type IndividualShiftInsert = Tables['individual_shifts']['Insert']
export type IndividualShiftUpdate = Tables['individual_shifts']['Update']
export type ShiftStatus = Enums['shift_status']
export type ShiftCategory = Enums['shift_category']
export type ShiftPattern = Enums['shift_pattern']

// Schedule Types
export type Schedule = Tables['schedules']['Row']
export type ScheduleInsert = Tables['schedules']['Insert']
export type ScheduleUpdate = Tables['schedules']['Update']
export type SchedulePeriod = Tables['schedule_periods']['Row']

// Time Off Types
export type TimeOffRequest = Tables['time_off_requests']['Row']
export type TimeOffRequestInsert = Tables['time_off_requests']['Insert']
export type TimeOffRequestUpdate = Tables['time_off_requests']['Update']
export type TimeOffStatus = Enums['time_off_status']

// Shift Swap Types
export type ShiftSwapRequest = Tables['shift_swap_requests']['Row']
export type ShiftSwapRequestInsert = Tables['shift_swap_requests']['Insert']
export type ShiftSwapRequestUpdate = Tables['shift_swap_requests']['Update']

// Staffing Types
export type StaffingRequirement = Tables['staffing_requirements']['Row']
export type StaffingRequirementInsert = Tables['staffing_requirements']['Insert']
export type StaffingRequirementUpdate = Tables['staffing_requirements']['Update']

// Shift Option Types
export type ShiftOption = Tables['shift_options']['Row']
export type ShiftOptionInsert = Tables['shift_options']['Insert']
export type ShiftOptionUpdate = Tables['shift_options']['Update']

// Profile Types
export type Profile = Tables['profiles']['Row']
export type ProfileInsert = Tables['profiles']['Insert']
export type ProfileUpdate = Tables['profiles']['Update']

// Log Types
export type SchedulingLog = Tables['scheduling_logs']['Row']
export type LogSeverity = Enums['log_severity']

// Scoring Types
export type ShiftAssignmentScore = Tables['shift_assignment_scores']['Row']

// Pattern Rule Types
export type ShiftPatternRule = Tables['shift_pattern_rules']['Row']

// View Types
export type ScheduleStatistics = Database['public']['Views']['mv_schedule_statistics']['Row']

// Function Types
export type ValidateSessionFn = Database['public']['Functions']['validate_session']

// Utility Types
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }
export type WithOptional<T, K extends keyof T> = Omit<T, K> & { [P in K]?: T[P] }
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Re-export all model types
export * from './models/employee'
export * from './models/shift'
export * from './models/schedule'
export * from './models/time-off'

// Re-export database enums with aliases
export type ShiftStatus = Database['public']['Enums']['shift_status']
export type TimeOffStatus = 'pending' | 'approved' | 'rejected'
export type LogSeverity = Database['public']['Enums']['log_severity']

// Table Types
export type IndividualShift = Database['public']['Tables']['individual_shifts']['Row']
export type ShiftOption = Database['public']['Tables']['shift_options']['Row']
export type StaffingRequirement = Database['public']['Tables']['staffing_requirements']['Row']
export type TimeOffRequest = Database['public']['Tables']['time_off_requests']['Row']
export type ShiftSwapRequest = Database['public']['Tables']['shift_swap_requests']['Row']

// Insert Types
export type EmployeeInsert = Omit<Employee, 'id' | 'created_at' | 'updated_at'>
export type ShiftInsert = Database['public']['Tables']['individual_shifts']['Insert']
export type TimeOffRequestInsert = Database['public']['Tables']['time_off_requests']['Insert']
export type ShiftSwapRequestInsert = Database['public']['Tables']['shift_swap_requests']['Insert']

// Update Types
export type EmployeeUpdate = Partial<EmployeeInsert>
export type ShiftUpdate = Database['public']['Tables']['individual_shifts']['Update']
export type TimeOffRequestUpdate = Database['public']['Tables']['time_off_requests']['Update']
export type ShiftSwapRequestUpdate = Database['public']['Tables']['shift_swap_requests']['Update']

// Event types for calendar
export interface ShiftEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  extendedProps: {
    employeeId: string
    shiftOptionId: string
    status: string
  }
}