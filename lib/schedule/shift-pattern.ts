import { ShiftAssignment, ValidationResult } from '@/types/schedule'
import { parseISO, differenceInDays, addDays } from 'date-fns'

type ShiftPattern = '4x10' | '3x12+4'

function getShiftDuration(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  
  let duration = endHour - startHour
  if (endMinute < startMinute) {
    duration -= 1
  }
  if (duration < 0) {
    duration += 24 // Handle shifts that cross midnight
  }
  
  return duration
}

export function validateShiftPattern(
  assignments: ShiftAssignment[],
  pattern: ShiftPattern
): ValidationResult {
  const errors: string[] = []

  // Sort assignments by date
  const sortedAssignments = [...assignments].sort((a, b) => 
    a.date.localeCompare(b.date)
  )

  // Check pattern requirements
  switch (pattern) {
    case '4x10': {
      // Check number of shifts
      if (sortedAssignments.length !== 4) {
        errors.push(`Pattern requires 4 shifts, but found ${sortedAssignments.length}`)
      }

      // Check shift durations
      sortedAssignments.forEach(assignment => {
        const duration = getShiftDuration(assignment.startTime, assignment.endTime)
        if (duration !== 10) {
          errors.push(`Shift on ${assignment.date} is not 10 hours long`)
        }
      })
      break
    }
    case '3x12+4': {
      // Check number of shifts
      if (sortedAssignments.length !== 4) {
        errors.push(`Pattern requires 4 shifts, but found ${sortedAssignments.length}`)
      }

      // Check first three shifts are 12 hours
      for (let i = 0; i < 3; i++) {
        if (i < sortedAssignments.length) {
          const duration = getShiftDuration(
            sortedAssignments[i].startTime,
            sortedAssignments[i].endTime
          )
          if (duration !== 12) {
            errors.push(`Shift on ${sortedAssignments[i].date} is not 12 hours long`)
          }
        }
      }

      // Check last shift is 4 hours
      if (sortedAssignments.length === 4) {
        const lastShift = sortedAssignments[3]
        const duration = getShiftDuration(lastShift.startTime, lastShift.endTime)
        if (duration !== 4) {
          errors.push(`Last shift on ${lastShift.date} is not 4 hours long`)
        }
      }
      break
    }
  }

  // Check consecutive days
  const consecutiveDaysResult = checkConsecutiveDays(sortedAssignments)
  if (!consecutiveDaysResult.isValid) {
    errors.push(...consecutiveDaysResult.errors)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function checkConsecutiveDays(assignments: ShiftAssignment[]): ValidationResult {
  const errors: string[] = []

  if (assignments.length <= 1) {
    return { isValid: true, errors: [] }
  }

  // Sort assignments by date
  const sortedAssignments = [...assignments].sort((a, b) => 
    a.date.localeCompare(b.date)
  )

  // Check each pair of consecutive dates
  for (let i = 1; i < sortedAssignments.length; i++) {
    const prevDate = parseISO(sortedAssignments[i - 1].date)
    const currDate = parseISO(sortedAssignments[i].date)
    const expectedDate = addDays(prevDate, 1)

    if (differenceInDays(currDate, expectedDate) !== 0) {
      errors.push('Shifts must be on consecutive days')
      break
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
} 