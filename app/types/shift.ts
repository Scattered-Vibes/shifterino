import { Database } from './supabase/database'

type Tables = Database['public']['Tables']

export type ShiftStatus = 'scheduled' | 'completed' | 'cancelled'

export interface Duration {
  days: number
  hours: number
  minutes: number
}

export interface ShiftEvent {
  id: string
  title?: string
  start: Date
  end: Date
  allDay?: boolean
  extendedProps: {
    employeeId: string
    shiftOptionId: string
    status: ShiftStatus
    supervisorRequired: boolean
    notes?: string
  }
}

export interface ShiftUpdateData extends Omit<Tables['schedules']['Update'], 'id'> {
  actual_start_time?: string
  actual_end_time?: string
  actual_hours_worked?: number
  shift_option_id?: string
  status?: ShiftStatus
  notes?: string
}

export interface StaffingRequirement {
  timeStart: string
  timeEnd: string
  minStaff: number
  supervisorRequired: boolean
}

export interface TimeOffRequest {
  id: string
  employeeId: string
  startDate: Date
  endDate: Date
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedAt?: Date
  reviewedBy?: string
}

export interface ShiftSwapRequest {
  id: string
  requestingEmployeeId: string
  requestedEmployeeId: string
  originalShiftId: string
  targetShiftId?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedAt?: Date
  reviewedBy?: string
}

export interface OnCallSchedule {
  id: string
  employeeId: string
  startDate: Date
  endDate: Date
  priority: number
  notes?: string
} 