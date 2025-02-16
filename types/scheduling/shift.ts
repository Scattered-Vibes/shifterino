import type { Employee } from '../models/employee'
import type { IndividualShift } from '@/types/supabase/index'

/**
 * Represents the type of shift pattern an employee can work
 */
export type ShiftPatternType = 'PATTERN_A' | 'PATTERN_B'

/**
 * Represents the possible statuses for a shift
 */
export type ShiftStatus = IndividualShift['status']

/**
 * Represents a shift event with complete timing information
 */
export interface ShiftEvent extends IndividualShift {
  /** Start time of the shift in ISO format */
  start: string
  /** End time of the shift in ISO format */
  end: string
  /** Type of shift pattern this belongs to */
  pattern: ShiftPatternType
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
  shift: IndividualShift,
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
    ...shift,
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    pattern: shiftOption.pattern
  }
}