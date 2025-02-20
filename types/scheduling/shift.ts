import type { Employee } from '../models/employee'
import type { Database } from '../supabase/database'
import type { ShiftPattern } from '../shift-patterns'

type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

/**
 * Represents the type of shift pattern an employee can work
 */
export type ShiftPatternType = ShiftPattern

/**
 * Represents the possible statuses for a shift
 */
export type ShiftStatus = 'scheduled' | 'completed' | 'cancelled'

/**
 * Represents a shift event with complete timing information
 */
export interface ShiftEvent {
  id: string
  employeeId: string
  employeeRole: 'dispatcher' | 'supervisor' | 'manager'
  title: string
  start: string // ISO date string
  end: string // ISO date string
  pattern: ShiftPatternType
  status: ShiftStatus
  overrideHoursCap?: boolean
  notes?: string
  shiftOptionId: string
}

export interface ShiftUpdateData {
  startTime: string // HH:mm
  endTime: string // HH:mm
  employeeId: string
  notes?: string
}

export interface ShiftSwapRequest {
  id: string
  requesterId: string
  requesterShiftId: string
  targetEmployeeId: string
  targetShiftId: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface OnCallSchedule {
  id: string
  employeeId: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  status: 'active' | 'inactive'
  notes?: string
}

export interface Duration {
  hours: number
  minutes: number
}

/**
 * Converts a database shift record to a ShiftEvent
 */
export function convertToShiftEvent(
  shift: {
    id: string
    employee_id: string
    date: string
    actual_hours_worked?: number
    status: ShiftStatus
    notes?: string
    created_at: string
    updated_at: string
    created_by?: string | null
    updated_by?: string | null
  },
  shiftOption: {
    start_time: string
    end_time: string
    pattern: ShiftPatternType
  }
): ShiftEvent {
  // Combine date with start/end times
  const [year, month, day] = shift.date.split('-')
  const startDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day)
  )
  const endDate = new Date(startDate)

  // Parse start time
  const [startHour, startMinute] = shiftOption.start_time.split(':')
  startDate.setHours(parseInt(startHour), parseInt(startMinute), 0, 0)

  // Parse end time
  const [endHour, endMinute] = shiftOption.end_time.split(':')
  endDate.setHours(parseInt(endHour), parseInt(endMinute), 0, 0)

  // If end time is before start time, it means the shift ends the next day
  if (endDate < startDate) {
    endDate.setDate(endDate.getDate() + 1)
  }

  return {
    id: shift.id,
    employeeId: shift.employee_id,
    employeeRole: 'dispatcher', // This needs to be updated to get actual role
    title: 'Shift', // This needs to be updated to get actual title
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    pattern: shiftOption.pattern,
    status: shift.status,
    notes: shift.notes,
    shiftOptionId: '0' // This needs to be updated to get actual shift option id
  }
}