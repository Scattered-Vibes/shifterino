import { TimeOffRequest, TimeOffType, TimeOffStatus, ValidationResult, ShiftAssignment } from '@/types/schedule'
import { parseISO, format, isAfter, isEqual, isWithinInterval } from 'date-fns'

function isValidDateFormat(date: string): boolean {
  try {
    const parsed = parseISO(date)
    return format(parsed, 'yyyy-MM-dd') === date
  } catch {
    return false
  }
}

const validTimeOffTypes: TimeOffType[] = ['vacation', 'sick', 'personal', 'bereavement', 'jury-duty']
const validTimeOffStatuses: TimeOffStatus[] = ['pending', 'approved', 'rejected']

export function validateTimeOffRequest(request: TimeOffRequest): ValidationResult {
  const errors: string[] = []

  // Validate date formats
  if (!isValidDateFormat(request.startDate)) {
    errors.push('Invalid date format: startDate must be YYYY-MM-DD')
  }
  if (!isValidDateFormat(request.endDate)) {
    errors.push('Invalid date format: endDate must be YYYY-MM-DD')
  }

  // Validate date order
  if (isValidDateFormat(request.startDate) && isValidDateFormat(request.endDate)) {
    const startDate = parseISO(request.startDate)
    const endDate = parseISO(request.endDate)
    
    if (isAfter(startDate, endDate)) {
      errors.push('End date must be after start date')
    }
  }

  // Validate type
  if (!validTimeOffTypes.includes(request.type)) {
    errors.push('Invalid time off type')
  }

  // Validate status
  if (!validTimeOffStatuses.includes(request.status)) {
    errors.push('Invalid status')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function checkTimeOffConflicts(
  request: TimeOffRequest,
  existingShifts: ShiftAssignment[]
): ShiftAssignment[] {
  const startDate = parseISO(request.startDate)
  const endDate = parseISO(request.endDate)

  return existingShifts.filter(shift => {
    // Only check shifts for the requesting employee
    if (shift.employeeId !== request.employeeId) {
      return false
    }

    const shiftDate = parseISO(shift.date)
    
    // Check if the shift date falls within the time off period
    return (
      isEqual(shiftDate, startDate) ||
      isEqual(shiftDate, endDate) ||
      isWithinInterval(shiftDate, { start: startDate, end: endDate })
    )
  })
} 