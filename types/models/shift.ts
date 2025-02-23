import type { Database } from '../supabase/database'
import type { ValidationResult } from '../validation'
import type { ShiftCategory } from './employee'
import type { ShiftPattern } from '../shift-patterns'
import { Employee } from './employee'

type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

/**
 * Base shift type from database
 */
export type Shift = Tables['shifts']['Row']

/**
 * Base assigned shift type from database
 */
export type AssignedShift = Tables['assigned_shifts']['Row']

/**
 * Re-export shift pattern type
 */
export type { ShiftPattern } from '../shift-patterns'

/**
 * Shift with employee and option details
 */
export interface ShiftWithDetails extends Shift {
  employee: Tables['employees']['Row']
  assignedShift?: AssignedShift
}

/**
 * Shift option configuration
 */
export interface ShiftOption {
  id: string
  name: string
  start_time: string  // HH:mm format
  end_time: string    // HH:mm format
  duration_hours: number
  category: 'early' | 'day' | 'swing' | 'graveyard'
  created_at: string
  updated_at: string
}

/**
 * Input for creating a new shift
 */
export type CreateShiftInput = Omit<
  Shift,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
>

/**
 * Input for updating an existing shift
 */
export type UpdateShiftInput = Partial<CreateShiftInput>

/**
 * Input for assigning a shift
 */
export type CreateAssignedShiftInput = Omit<
  AssignedShift,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
>

/**
 * Input for updating an assigned shift
 */
export type UpdateAssignedShiftInput = Partial<CreateAssignedShiftInput>

/**
 * Shift validation result
 */
export interface ShiftValidationResult extends ValidationResult {
  shift: Shift
  conflicts: {
    type: 'OVERLAP' | 'HOURS' | 'REST' | 'PATTERN'
    message: string
    conflictingShiftId?: string
  }[]
}

/**
 * Fields that can be used to sort shifts
 */
export type ShiftSortField = keyof Pick<
  Shift,
  | 'name'
  | 'start_time'
  | 'end_time'
  | 'duration_hours'
  | 'created_at'
  | 'updated_at'
>

/**
 * Shift sort configuration
 */
export interface ShiftSort {
  field: ShiftSortField
  direction: 'asc' | 'desc'
}

/**
 * Shift filter options
 */
export interface ShiftFilters {
  startDate?: string
  endDate?: string
  employeeId?: string
  category?: ShiftCategory
  isOvernight?: boolean
  minDuration?: number
  maxDuration?: number
  searchTerm?: string
}

export interface IndividualShift {
  id: string
  employee_id: string
  shift_option_id: string
  date: string
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  shift_option?: ShiftOption
  employee?: Employee
}

export interface ShiftSwapRequest {
  id: string
  requester_id: string
  requested_shift_id: string
  offered_shift_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

// Types from Supabase
export type ShiftOptionRow = Tables['shift_options']['Row']
export type IndividualShiftRow = Tables['individual_shifts']['Row']
export type ShiftSwapRequestRow = Tables['shift_swap_requests']['Row']

// Insert types
export type ShiftOptionInsert = Tables['shift_options']['Insert']
export type IndividualShiftInsert = Tables['individual_shifts']['Insert']
export type ShiftSwapRequestInsert = Tables['shift_swap_requests']['Insert']

// Update types
export type ShiftOptionUpdate = Tables['shift_options']['Update']
export type IndividualShiftUpdate = Tables['individual_shifts']['Update']
export type ShiftSwapRequestUpdate = Tables['shift_swap_requests']['Update']