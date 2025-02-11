import type { Database } from '../database'

export type EmployeeRole = Database['public']['Tables']['employees']['Row']['role']
export type ShiftPattern = Database['public']['Tables']['employees']['Row']['shift_pattern']

export type EmployeeRow = Database['public']['Tables']['employees']['Row']

export interface Employee {
  id: string
  auth_id: string
  first_name: string
  last_name: string
  email: string
  role: EmployeeRole
  shift_pattern: ShiftPattern
  preferred_shift_category: string | null
  max_hours_per_week: number
  created_at: string
  updated_at: string
  full_name?: string
}

export type EmployeeCreate = Database['public']['Tables']['employees']['Insert']
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update']

export interface EmployeeBasic {
  id: string
  first_name: string
  last_name: string
  email: string
  role: EmployeeRole
}

export interface EmployeeWithSchedule extends Employee {
  schedule: {
    id: string
    start_date: string
    end_date: string
  } | null
}

export interface EmployeeStats {
  totalHours: number
  overtimeHours: number
  regularHours: number
  averageHoursPerWeek: number
  upcomingTimeOff: {
    start_date: string
    end_date: string
    type: string
  }[]
} 