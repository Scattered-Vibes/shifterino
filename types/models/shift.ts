import type { Database } from '@/types/supabase/database'
import type { Employee } from './employee'
import type { ValidationResult } from '../validation'

// Base types from Supabase
type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

// Core shift types from database
export type ShiftRow = Tables['shifts']['Row']
export type ShiftInsert = Tables['shifts']['Insert']
export type ShiftUpdate = Tables['shifts']['Update']

// Core shift assignment types from database
export type ShiftAssignmentRow = Tables['shift_assignments']['Row']
export type ShiftAssignmentInsert = Tables['shift_assignments']['Insert']
export type ShiftAssignmentUpdate = Tables['shift_assignments']['Update']

// Shift option types from database
export type ShiftOptionRow = Tables['shift_options']['Row']
export type ShiftOptionInsert = Tables['shift_options']['Insert']
export type ShiftOptionUpdate = Tables['shift_options']['Update']

// Database enums
export type ShiftPattern = Enums['shift_pattern']
export type ShiftCategory = Enums['shift_category']
export type ShiftStatus = Enums['shift_status']
export type ShiftAssignmentStatus = Enums['shift_assignment_status']
export type ShiftSwapStatus = Enums['shift_swap_status']

/**
 * Extended shift type with relationships
 */
export interface ShiftWithRelations extends ShiftRow {
  employee?: Employee;
  supervisor?: Employee;
  overrideHoursCap?: boolean;
}

/**
 * Shift option configuration
 */
export interface ShiftOption extends ShiftOptionRow {
  category: ShiftCategory;
  duration_hours: number;
}

/**
 * Individual shift assignment
 */
export interface IndividualShift extends ShiftAssignmentRow {
  shift_option?: ShiftOption;
  employee?: Employee;
}

/**
 * Shift swap request
 */
export interface ShiftSwapRequest {
  id: string;
  requester_id: string;
  requested_shift_id: string;
  offered_shift_id: string;
  status: ShiftSwapStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Shift validation result
 */
export interface ShiftValidationResult extends ValidationResult {
  shift: ShiftRow;
  conflicts: {
    type: 'OVERLAP' | 'HOURS' | 'REST' | 'PATTERN';
    message: string;
    conflictingShiftId?: string;
  }[];
  warnings: string[];
}

/**
 * Shift filter options
 */
export interface ShiftFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  category?: ShiftCategory;
  isOvernight?: boolean;
  minDuration?: number;
  maxDuration?: number;
  searchTerm?: string;
}

/**
 * Fields that can be used to sort shifts
 */
export type ShiftSortField = keyof Pick<
  ShiftRow,
  | 'id'
  | 'schedule_id'
  | 'department_id'
  | 'date'
  | 'start_time'
  | 'end_time'
  | 'shift_category'
  | 'shift_option_id'
  | 'is_published'
  | 'is_auto_generated'
  | 'created_at'
  | 'updated_at'
>;

/**
 * Shift sort configuration
 */
export interface ShiftSort {
  field: ShiftSortField;
  direction: 'asc' | 'desc';
}

/**
 * Shift with employee and option details
 */
export interface ShiftWithDetails extends ShiftRow {
  employee: Employee;
  shiftAssignment?: ShiftAssignmentRow;
}

// Input types
export type CreateShiftInput = Omit<
  ShiftRow,
  'id' | 'created_at' | 'updated_at'
>;

export type UpdateShiftInput = Partial<CreateShiftInput>;

export type CreateShiftAssignmentInput = Omit<
  ShiftAssignmentRow,
  'id' | 'assigned_at'
>;

export type UpdateShiftAssignmentInput = Partial<CreateShiftAssignmentInput>;