import type { Database } from './database.types'

// Re-export database types
export type { Database } from './database.types'

// Re-export database enums with aliases
export type EmployeeRole = Database['public']['Enums']['employee_role']
export type ShiftCategory = Database['public']['Enums']['shift_category']
export type ShiftPattern = Database['public']['Enums']['shift_pattern']
export type ShiftStatus = Database['public']['Enums']['shift_status']
export type TimeOffStatus = Database['public']['Enums']['time_off_status']

// Table Types
export type Employee = Database['public']['Tables']['employees']['Row']

export type Shift = Database['public']['Tables']['individual_shifts']['Row']
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