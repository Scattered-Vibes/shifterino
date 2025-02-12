import type { Database } from '@/types/supabase/database'
import type { EmployeeBasic } from './employee'
import type { Schedule } from '../scheduling/schedule'
import type { ShiftCategory } from '../scheduling/common'

// Base types from database
export type IndividualShift = Database['public']['Tables']['individual_shifts']['Row'] & {
  shift_option?: ShiftOption
}

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
  requesterId: string
  requestedEmployeeId: string
  shiftId: string
  proposedShiftId?: string
  status: Database['public']['Enums']['time_off_status']
  notes?: string
  createdAt: string
  updatedAt: string | null
}

export interface ShiftStats {
  totalHours: number
  consecutiveDays: number
  lastShiftEnd: string | null
  nextShiftStart: string | null
}

export interface ShiftOption {
  id: string
  name: string
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  durationHours: number
  category: ShiftCategory
  createdAt: string
  updatedAt: string
}

export interface Shift {
  id: string
  employeeId: string
  shiftOptionId: string
  schedulePeriodId: string
  date: string
  status: Database['public']['Enums']['shift_status']
  isOvertime: boolean
  actualStartTime?: string
  actualEndTime?: string
  breakStartTime?: string
  breakEndTime?: string
  breakDurationMinutes?: number
  actualHoursWorked?: number
  notes?: string
  scheduleConflictNotes?: string
  isRegularSchedule: boolean
  supervisorApprovedBy?: string
  supervisorApprovedAt?: string
  shiftScore?: number
  fatigueLevel?: number
  createdAt: string
  updatedAt: string
}