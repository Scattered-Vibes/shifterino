import type { Database } from '@/types/supabase/database'
import type { EmployeeBasic } from './employee'
import type { Schedule, ShiftOption } from './schedule'

// Base types from database
export type IndividualShift = Database['public']['Tables']['individual_shifts']['Row'] & {
  shift_option?: ShiftOption
}
export type ShiftStatus = Database['public']['Enums']['shift_status']
export type ShiftCategory = Database['public']['Enums']['shift_category']

// Extended types
export interface ShiftWithEmployee extends IndividualShift {
  employee: EmployeeBasic
}

export interface ShiftWithSchedule extends IndividualShift {
  schedule: Schedule
}

// Create/Update types
export type ShiftCreate = Omit<IndividualShift, 'id' | 'created_at' | 'updated_at'> & {
  employee_id: string
  shift_option_id: string
  date: string
  notes?: string
}

export type ShiftUpdate = Partial<Omit<ShiftCreate, 'shift_option_id' | 'employee_id'>>

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