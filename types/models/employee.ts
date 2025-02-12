import type { Database } from '../supabase/database'

type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

// Base Types
export type Employee = Tables['employees']['Row']
export type EmployeeInsert = Tables['employees']['Insert']
export type EmployeeUpdate = Tables['employees']['Update']
export type EmployeeRole = Enums['employee_role']

// Extended Types
export interface EmployeeWithSchedule extends Employee {
  current_schedule?: Tables['schedules']['Row']
  upcoming_shifts?: Tables['individual_shifts']['Row'][]
}

export interface EmployeeWithStats extends Employee {
  total_hours_worked: number
  average_hours_per_week: number
  overtime_hours: number
  consecutive_days_worked: number
}

export interface EmployeeWithTimeOff extends Employee {
  time_off_requests: Tables['time_off_requests']['Row'][]
  upcoming_time_off: Tables['time_off_requests']['Row'][]
}

// Create Types
export interface CreateEmployeeInput {
  first_name: string
  last_name: string
  email: string
  role: EmployeeRole
  shift_pattern: Enums['shift_pattern']
  preferred_shift_category: Enums['shift_category']
  weekly_hours_cap: number
  max_overtime_hours: number
}

// Update Types
export type UpdateEmployeeInput = Partial<CreateEmployeeInput>

// Filter Types
export interface EmployeeFilters {
  role?: EmployeeRole
  shift_pattern?: Enums['shift_pattern']
  shift_category?: Enums['shift_category']
  is_active?: boolean
  search?: string
}

// Sort Types
export type EmployeeSortField = 
  | 'first_name'
  | 'last_name'
  | 'role'
  | 'shift_pattern'
  | 'weekly_hours'
  | 'created_at'

export interface EmployeeSort {
  field: EmployeeSortField
  direction: 'asc' | 'desc'
}

// Utility Types
export interface EmployeeSchedulePreferences {
  preferred_days: string[]
  preferred_shifts: string[]
  max_consecutive_shifts: number
  min_hours_between_shifts: number
}

export interface EmployeeAvailability {
  employee_id: string
  date: string
  is_available: boolean
  reason?: string
} 