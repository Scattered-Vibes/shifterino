import type { Database } from './database'

export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']

// Auth and User types
export type UserRole = Enums['employee_role']
export type EmployeeStatus = Enums['employee_status']

// Table row types
export type Employee = Tables['employees']['Row']
export type Shift = Tables['individual_shifts']['Row']
export type ShiftOption = Tables['shift_options']['Row']
export type StaffingRequirement = Tables['staffing_requirements']['Row']
export type TimeOffRequest = Tables['time_off_requests']['Row']
export type ShiftSwapRequest = Tables['shift_swap_requests']['Row']

// Insert types
export type EmployeeInsert = Tables['employees']['Insert']
export type ShiftInsert = Tables['individual_shifts']['Insert']
export type TimeOffRequestInsert = Tables['time_off_requests']['Insert']
export type ShiftSwapRequestInsert = Tables['shift_swap_requests']['Insert']

// Update types
export type EmployeeUpdate = Tables['employees']['Update']
export type ShiftUpdate = Tables['individual_shifts']['Update']
export type TimeOffRequestUpdate = Tables['time_off_requests']['Update']
export type ShiftSwapRequestUpdate = Tables['shift_swap_requests']['Update'] 