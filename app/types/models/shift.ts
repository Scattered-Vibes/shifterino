import type { Database } from '@/types/supabase/database'
import type { EmployeeBasic } from './employee'
import type { Schedule } from './schedule'
import type { ValidationResult, BaseConflict } from '../shared/common'

// Base shift type from database
export type IndividualShift = Database['public']['Tables']['individual_shifts']['Row']
export type ShiftStatus = Database['public']['Enums']['shift_status']
export type ShiftCategory = Database['public']['Enums']['shift_category']

// Shift template for creating new shifts
export interface ShiftTemplate {
  start_time: string
  end_time: string
  category: ShiftCategory
  required_staff_count: number
  requires_supervisor: boolean
}

// Extended shift types
export interface ShiftWithEmployee extends IndividualShift {
  employee: EmployeeBasic
}

export interface ShiftWithSchedule extends IndividualShift {
  schedule: Schedule
}

export type ShiftValidation = ValidationResult

export interface ShiftConflict extends BaseConflict {
  type: 'overlap' | 'consecutive' | 'hours_exceeded'
  conflictingShift?: IndividualShift
}

export interface ShiftOption {
  id: string
  label: string
  start_time: string
  end_time: string
  duration_hours: number
  category: ShiftCategory
  color: string
}

// Calendar event type for FullCalendar
export interface ShiftEvent {
  id: string
  title: string
  start: Date
  end: Date
  employee_id: string
  is_supervisor: boolean
  status: ShiftStatus
  actual_start_time: string | null
  actual_end_time: string | null
  notes: string | null
  extendedProps: {
    employeeId: string
    category: ShiftCategory
    status: ShiftStatus
  }
}

// Types for creating and updating shifts
export type ShiftCreate = Omit<IndividualShift, 'id' | 'created_at' | 'updated_at'> & {
  employee_id: string
  shift_option_id: string
  date: string
  status: ShiftStatus
  notes?: string
}

export type ShiftUpdateData = Partial<Omit<Database['public']['Tables']['individual_shifts']['Update'], 'id'>>

// Additional types for shift management
export interface ShiftSwapRequest {
  id: string
  requester_id: string
  requested_employee_id: string
  shift_id: string
  proposed_shift_id?: string
  status: Database['public']['Enums']['time_off_status']
  notes?: string
  created_at: string
  updated_at: string | null
}

export interface ShiftStats {
  total_hours: number
  consecutive_days: number
  last_shift_end: string | null
  next_shift_start: string | null
}