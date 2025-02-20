import type { Database } from '../supabase/database'
import type { ValidationResult } from '../validation'
import type { ShiftCategory } from './employee'
import type { ShiftPattern } from '../shift-patterns'

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
  category: ShiftCategory
  startTime: string  // HH:mm
  endTime: string    // HH:mm
  durationHours: number
  isOvernight: boolean
  requiredRole?: Enums['employee_role']
  minStaff?: number
  maxStaff?: number
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