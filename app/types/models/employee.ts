import type { Database } from '@/types/supabase/database'
import type { IndividualShift } from './shift'
import type { Schedule } from './schedule'

// Database types
type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

// Base employee type from database
export type Employee = Tables['employees']['Row']
export type EmployeeRole = Enums['employee_role']
export type ShiftPattern = Enums['shift_pattern']
export type ShiftCategory = Enums['shift_category']

// Minimal employee type for relationships
export interface EmployeeBasic {
  id: string
  auth_id: string
  first_name: string
  last_name: string
  email: string
  role: EmployeeRole
  shift_pattern: ShiftPattern
  created_at: string
  updated_at: string
}

// Extended types for business logic
export interface EmployeeSchedulePreferences {
  preferred_shift_category: ShiftCategory | null
  max_overtime_hours: number | null
  weekly_hours_cap: number
}

export interface EmployeeStats {
  consecutive_shifts_count: number
  total_hours_current_week: number
  last_shift_date: string | null
}

export interface EmployeeWithSchedule extends Employee {
  schedules: Schedule[]
}

export interface EmployeeWithShifts extends Employee {
  shifts: IndividualShift[]
}

export type EmployeeCreate = Omit<Employee, 'id' | 'created_at' | 'updated_at'> & {
  auth_id: string
  email: string
  first_name: string
  last_name: string
  role: EmployeeRole
  shift_pattern: ShiftPattern
  weekly_hours_cap: number
}

export type EmployeeUpdate = Partial<Omit<EmployeeCreate, 'auth_id'>>

// Additional types
export interface EmployeeAvailability {
  id: string
  employee_id: string
  start_date: string
  end_date: string
  is_available: boolean
  reason?: string
  created_at: string
  updated_at: string
} 