import type { Database } from './supabase/database'

type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

/**
 * Base validation error structure
 */
export interface ValidationError {
  code: string
  message: string
  details?: Record<string, unknown>
}

/**
 * Generic validation result
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Schedule-specific validation result
 */
export interface ScheduleValidation extends ValidationResult {
  conflicts: SchedulingConflict[]
  suggestions: string[]
}

/**
 * Types of scheduling conflicts
 */
export type ConflictType = 
  | 'overlap' 
  | 'pattern' 
  | 'hours' 
  | 'staffing' 
  | 'supervisor' 
  | 'rest'

/**
 * Detailed scheduling conflict information
 */
export interface SchedulingConflict {
  id: string
  type: ConflictType
  severity: 'error' | 'warning'
  message: string
  affectedShifts: string[]
  startTime: string
  endTime: string
  resolution?: ConflictResolution
}

/**
 * Possible conflict resolution actions
 */
export interface ConflictResolution {
  action: 'reassign' | 'adjust' | 'split' | 'delete'
  shiftId: string
  newEmployeeId?: string
  adjustedTime?: string
}

/**
 * Staffing validation result with detailed period information
 */
export interface StaffingValidationResult extends ValidationResult {
  understaffedPeriods: UnderstaffedPeriod[]
  overstaffedPeriods: OverstaffedPeriod[]
}

interface UnderstaffedPeriod {
  timeRange: string
  currentStaff: number
  requiredStaff: number
  isSupervisorMissing: boolean
}

interface OverstaffedPeriod {
  timeRange: string
  currentStaff: number
  requiredStaff: number
  excessStaff: number
}

/**
 * Generic validation response with data
 */
export interface ValidationResponse<T> {
  success: boolean
  data?: T
  error?: ValidationError
} 