import type { Database } from '@/types/supabase/database'

type Tables = Database['public']['Tables']
export type IndividualShift = Tables['individual_shifts']['Row']
export type ShiftOption = Tables['shift_options']['Row']
export type Employee = Tables['employees']['Row']
export type ShiftStatus = IndividualShift['status']

export interface ShiftWithDetails extends Omit<IndividualShift, 'employee_id' | 'shift_option_id'> {
  employee: Employee
  shift_option: ShiftOption
}

export interface ShiftUpdateData {
  employee_id?: string
  shift_option_id?: string
  date?: string
  start_time?: string
  end_time?: string
  status?: ShiftStatus
  notes?: string
}

export interface GetShiftsOptions {
  startDate?: Date
  endDate?: Date
  employeeId?: string
  includeEmployee?: boolean
}

export interface SearchShiftsOptions {
  scheduleId?: string
  employeeId?: string
  startDate?: string
  endDate?: string
} 