import type { Database } from '../supabase/database'
import type { Employee } from './employee'

type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

// Base Types
export type IndividualShift = Tables['individual_shifts']['Row']
export type IndividualShiftInsert = Tables['individual_shifts']['Insert']
export type IndividualShiftUpdate = Tables['individual_shifts']['Update']

export type ShiftOption = Tables['shift_options']['Row']
export type ShiftOptionInsert = Tables['shift_options']['Insert']
export type ShiftOptionUpdate = Tables['shift_options']['Update']

export type ShiftSwapRequest = Tables['shift_swap_requests']['Row']
export type ShiftSwapRequestInsert = Tables['shift_swap_requests']['Insert']
export type ShiftSwapRequestUpdate = Tables['shift_swap_requests']['Update']

// Enum Types
export type ShiftStatus = Enums['shift_status']
export type ShiftCategory = Enums['shift_category']
export type ShiftPattern = Enums['shift_pattern']

// Extended Types
export interface IndividualShiftWithDetails extends IndividualShift {
  employee: Employee
  shift_option: ShiftOption
  swap_requests: ShiftSwapRequest[]
}

export interface ShiftOptionWithStats {
  id: string
  name: string
  category: ShiftCategory
  start_time: string
  end_time: string
  duration_hours: number
  total_assignments: number
  average_score: number
  employee_preferences: {
    employee_id: string
    preference_score: number
  }[]
}

// Create Types
export interface CreateShiftInput {
  date: string
  employee_id: string
  shift_option_id: string
  is_overtime?: boolean
  notes?: string
}

export interface CreateShiftOptionInput {
  name: string
  category: ShiftCategory
  start_time: string
  end_time: string
  duration_hours: number
}

export interface CreateShiftSwapRequestInput {
  shift_id: string
  requested_employee_id: string
  notes?: string
  proposed_shift_id?: string
}

// Update Types
export type UpdateShiftInput = Partial<CreateShiftInput>
export type UpdateShiftOptionInput = Partial<CreateShiftOptionInput>
export type UpdateShiftSwapRequestInput = Partial<CreateShiftSwapRequestInput>

// Filter Types
export interface ShiftFilters {
  start_date?: string
  end_date?: string
  employee_id?: string
  status?: ShiftStatus
  category?: ShiftCategory
  is_overtime?: boolean
}

export interface ShiftSwapRequestFilters {
  status?: 'pending' | 'approved' | 'rejected'
  requester_id?: string
  requested_employee_id?: string
  shift_id?: string
}

// Sort Types
export type ShiftSortField = 
  | 'date'
  | 'employee_name'
  | 'shift_type'
  | 'status'
  | 'created_at'

export interface ShiftSort {
  field: ShiftSortField
  direction: 'asc' | 'desc'
}

// Utility Types
export interface ShiftConflict {
  type: 'overlap' | 'insufficient_rest' | 'overtime' | 'availability'
  message: string
  conflicting_shift_id?: string
}

export interface ShiftValidation {
  is_valid: boolean
  conflicts: ShiftConflict[]
}

export interface ShiftStatistics {
  total_shifts: number
  total_hours: number
  overtime_hours: number
  average_score: number
  conflicts_count: number
}