import type { Database } from '../database'
import type { EmployeeBasic } from './employee'

export type ShiftStatus = 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled'
export type ShiftType = 'regular' | 'overtime' | 'training' | 'meeting'
export type ShiftPattern = 'pattern_a' | 'pattern_b' | 'custom'

export interface IndividualShift {
  id: string
  employee_id: string
  schedule_id: string
  start_time: string
  end_time: string
  actual_start_time: string | null
  actual_end_time: string | null
  actual_hours_worked: number | null
  break_duration_minutes: number | null
  break_start_time: string | null
  break_end_time: string | null
  shift_type: ShiftType
  status: ShiftStatus
  notes: string | null
  is_supervisor: boolean
  is_overtime: boolean
  is_regular_schedule: boolean
  fatigue_level: number | null
  date: string
  created_at: string
  updated_at: string
}

export interface ShiftEvent extends Omit<IndividualShift, 'start_time' | 'end_time'> {
  title: string
  start: string
  end: string
  allDay?: boolean
  extendedProps: {
    employeeId: string
    shiftType: ShiftType
    status: ShiftStatus
    shiftOptionId?: string
  }
}

export type ShiftCreate = Omit<IndividualShift, 'id' | 'created_at' | 'updated_at'>

export type ShiftUpdate = Partial<Omit<IndividualShift, 'id' | 'created_at' | 'updated_at'>>

export interface ShiftOption {
  id: string
  name: string
  start_time: string
  end_time: string
  duration_hours: number
  category: string
  is_supervisor_shift: boolean
  created_at: string
  updated_at: string
}

export interface ShiftSwapRequest {
  id: string
  requester_id: string
  requested_shift_id: string
  proposed_shift_id: string | null
  status: Database['public']['Enums']['swap_request_status']
  reason: string | null
  reviewer_id: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface ShiftSwapRequestWithDetails extends ShiftSwapRequest {
  requester: EmployeeBasic
  reviewer: EmployeeBasic | null
  requested_shift: IndividualShift
  proposed_shift: IndividualShift | null
}

export interface ShiftValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
} 