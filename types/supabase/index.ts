import type { Database } from './database'

// Re-export the Database type
export type { Database }

// Helper types for working with tables
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']

// Generic table type helpers
export type TableRow<T extends keyof Tables> = Tables[T]['Row']
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert']
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update']

// Table names
export type TableName = keyof Tables

// Enum types
export type ShiftPattern = Enums['shift_pattern']
export type ShiftCategory = Enums['shift_category']
export type EmployeeRole = Enums['employee_role']

// Table row types
export type EmployeeRow = TableRow<'employees'>
export type ShiftOptionRow = TableRow<'shift_options'>
export type IndividualShiftRow = TableRow<'individual_shifts'>
export type ScheduleRow = TableRow<'schedules'>
export type StaffingRequirementRow = TableRow<'staffing_requirements'>
export type TimeOffRequestRow = TableRow<'time_off_requests'>
export type ShiftSwapRequestRow = TableRow<'shift_swap_requests'>
export type AuthLogRow = TableRow<'auth_logs'>

// Table insert types
export type EmployeeInsert = TableInsert<'employees'>
export type ShiftOptionInsert = TableInsert<'shift_options'>
export type IndividualShiftInsert = TableInsert<'individual_shifts'>
export type ScheduleInsert = TableInsert<'schedules'>
export type StaffingRequirementInsert = TableInsert<'staffing_requirements'>
export type TimeOffRequestInsert = TableInsert<'time_off_requests'>
export type ShiftSwapRequestInsert = TableInsert<'shift_swap_requests'>
export type AuthLogInsert = TableInsert<'auth_logs'>

// Table update types
export type EmployeeUpdate = TableUpdate<'employees'>
export type ShiftOptionUpdate = TableUpdate<'shift_options'>
export type IndividualShiftUpdate = TableUpdate<'individual_shifts'>
export type ScheduleUpdate = TableUpdate<'schedules'>
export type StaffingRequirementUpdate = TableUpdate<'staffing_requirements'>
export type TimeOffRequestUpdate = TableUpdate<'time_off_requests'>
export type ShiftSwapRequestUpdate = TableUpdate<'shift_swap_requests'>
export type AuthLogUpdate = TableUpdate<'auth_logs'>

// Common type aliases for backward compatibility
export type Employee = EmployeeRow
export type Shift = IndividualShiftRow
export type ShiftOption = ShiftOptionRow
export type StaffingRequirement = StaffingRequirementRow
export type TimeOffRequest = TimeOffRequestRow
export type ShiftSwapRequest = ShiftSwapRequestRow 