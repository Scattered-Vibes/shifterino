import type { TimeOffRequest } from '@/types/supabase/index'
import type { ShiftEvent } from '@/types/scheduling/shift'
import { isWithinInterval, parseISO, areIntervalsOverlapping } from 'date-fns'

interface TimeOffConflict {
  timeOffRequest: TimeOffRequest
  conflictingShift: ShiftEvent
  type: 'FULL_OVERLAP' | 'PARTIAL_OVERLAP'
}

/**
 * Checks if a shift conflicts with any approved time off requests
 * @param shift The shift to check
 * @param timeOffRequests List of approved time off requests
 * @returns Array of conflicts found, empty if no conflicts
 */
export function checkTimeOffConflicts(
  shift: ShiftEvent,
  timeOffRequests: TimeOffRequest[]
): TimeOffConflict[] {
  const conflicts: TimeOffConflict[] = []
  const shiftStart = parseISO(shift.start)
  const shiftEnd = parseISO(shift.end)

  // Only check approved time off requests for the shift's employee
  const relevantRequests = timeOffRequests.filter(
    request =>
      request.employee_id === shift.employee_id &&
      request.status === 'approved'
  )

  for (const request of relevantRequests) {
    const timeOffStart = parseISO(request.start_date)
    const timeOffEnd = parseISO(request.end_date)

    // Check if the shift overlaps with the time off period
    if (areIntervalsOverlapping(
      { start: shiftStart, end: shiftEnd },
      { start: timeOffStart, end: timeOffEnd }
    )) {
      // Determine if it's a full or partial overlap
      const type = isWithinInterval(shiftStart, { start: timeOffStart, end: timeOffEnd }) &&
                  isWithinInterval(shiftEnd, { start: timeOffStart, end: timeOffEnd })
        ? 'FULL_OVERLAP'
        : 'PARTIAL_OVERLAP'

      conflicts.push({
        timeOffRequest: request,
        conflictingShift: shift,
        type
      })
    }
  }

  return conflicts
}

/**
 * Checks if a time off request conflicts with any existing shifts
 * @param timeOffRequest The time off request to check
 * @param shifts List of existing shifts
 * @returns Array of conflicts found, empty if no conflicts
 */
export function checkShiftConflicts(
  timeOffRequest: TimeOffRequest,
  shifts: ShiftEvent[]
): TimeOffConflict[] {
  const conflicts: TimeOffConflict[] = []
  const timeOffStart = parseISO(timeOffRequest.start_date)
  const timeOffEnd = parseISO(timeOffRequest.end_date)

  // Only check shifts for the employee requesting time off
  const relevantShifts = shifts.filter(
    shift => shift.employee_id === timeOffRequest.employee_id
  )

  for (const shift of relevantShifts) {
    const shiftStart = parseISO(shift.start)
    const shiftEnd = parseISO(shift.end)

    // Check if the shift overlaps with the time off period
    if (areIntervalsOverlapping(
      { start: timeOffStart, end: timeOffEnd },
      { start: shiftStart, end: shiftEnd }
    )) {
      // Determine if it's a full or partial overlap
      const type = isWithinInterval(shiftStart, { start: timeOffStart, end: timeOffEnd }) &&
                  isWithinInterval(shiftEnd, { start: timeOffStart, end: timeOffEnd })
        ? 'FULL_OVERLAP'
        : 'PARTIAL_OVERLAP'

      conflicts.push({
        timeOffRequest,
        conflictingShift: shift,
        type
      })
    }
  }

  return conflicts
}

/**
 * Checks if a time off request conflicts with any other time off requests
 * @param timeOffRequest The time off request to check
 * @param existingRequests List of existing time off requests
 * @returns True if there are conflicts, false otherwise
 */
export function checkTimeOffRequestConflicts(
  timeOffRequest: TimeOffRequest,
  existingRequests: TimeOffRequest[]
): boolean {
  const timeOffStart = parseISO(timeOffRequest.start_date)
  const timeOffEnd = parseISO(timeOffRequest.end_date)

  // Only check other approved requests for the same employee
  const relevantRequests = existingRequests.filter(
    request =>
      request.employee_id === timeOffRequest.employee_id &&
      request.id !== timeOffRequest.id && // Don't compare with self
      request.status === 'approved'
  )

  return relevantRequests.some(request => {
    const existingStart = parseISO(request.start_date)
    const existingEnd = parseISO(request.end_date)

    return areIntervalsOverlapping(
      { start: timeOffStart, end: timeOffEnd },
      { start: existingStart, end: existingEnd }
    )
  })
} 