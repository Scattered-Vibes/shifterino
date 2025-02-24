import type { Database } from '@/types/supabase/database'

type Tables = Database['public']['Tables']
export type Employee = Tables['employees']['Row']
export type EmployeeRole = Employee['role']

export interface EmployeeWithShifts extends Employee {
  shifts: Tables['individual_shifts']['Row'][]
}

export interface EmployeeUpdateData {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  role?: EmployeeRole
  default_weekly_hours?: number
  weekly_hours_cap?: number
  is_active?: boolean
  notes?: string
}

export interface GetEmployeesOptions {
  includeShifts?: boolean
  includeTimeOffRequests?: boolean
  isActive?: boolean
  role?: EmployeeRole
  searchTerm?: string
}

export interface EmployeeAvailability {
  employee_id: string
  start_date: string
  end_date: string
  is_available: boolean
  reason?: string
} 