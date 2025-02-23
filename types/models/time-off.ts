import { Database } from '@/types/supabase/database'
import type { ValidationResult } from '../validation'
import type { Employee } from './employee'

type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

/**
 * Base time off request type from database
 */
export type TimeOffRequest = Tables['time_off_requests']['Row']

/**
 * Time off request status from database enums
 */
export type TimeOffStatus = 'pending' | 'approved' | 'rejected'

/**
 * Time off request with employee details
 */
export interface TimeOffRequestWithDetails extends TimeOffRequest {
  employee: Employee
  totalDays: number
  conflictingShifts: {
    id: string
    date: string
    startTime: string
    endTime: string
  }[]
}

/**
 * Time off request validation result
 */
export interface TimeOffValidationResult extends ValidationResult {
  request: TimeOffRequest
  conflicts: {
    type: 'OVERLAP' | 'BALANCE' | 'NOTICE' | 'STAFFING'
    message: string
    date?: string
  }[]
}

/**
 * Input for creating a new time off request
 */
export type CreateTimeOffRequestInput = Omit<
  TimeOffRequest,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
>

/**
 * Input for updating an existing time off request
 */
export type UpdateTimeOffRequestInput = Partial<CreateTimeOffRequestInput>

/**
 * Time off request filter options
 */
export interface TimeOffRequestFilters {
  startDate?: string
  endDate?: string
  employeeId?: string
  status?: TimeOffStatus
  searchTerm?: string
}

/**
 * Fields that can be used to sort time off requests
 */
export type TimeOffRequestSortField = keyof Pick<
  TimeOffRequest,
  | 'start_date'
  | 'end_date'
  | 'status'
  | 'created_at'
  | 'updated_at'
>

/**
 * Time off request sort configuration
 */
export interface TimeOffRequestSort {
  field: TimeOffRequestSortField
  direction: 'asc' | 'desc'
}

/**
 * Time off balance for an employee
 */
export interface TimeOffBalance {
  employeeId: string
  year: number
  totalDays: number
  usedDays: number
  pendingDays: number
  remainingDays: number
  requests: TimeOffRequest[]
}

// Supabase types
export type TimeOffRequestRow = Tables['time_off_requests']['Row']
export type TimeOffRequestInsert = Tables['time_off_requests']['Insert']
export type TimeOffRequestUpdate = Tables['time_off_requests']['Update'] 