import { StaffingRequirement, ShiftAssignment, ValidationResult } from '@/types/schedule'
import { parseISO, format } from 'date-fns'

function isValidTimeFormat(time: string): boolean {
  return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(time)
}

function isValidDateFormat(date: string): boolean {
  try {
    const parsed = parseISO(date)
    return format(parsed, 'yyyy-MM-dd') === date
  } catch {
    return false
  }
}

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

function isValidShiftDuration(startTime: string, endTime: string): boolean {
  const duration = getShiftDuration(startTime, endTime)
  return [4, 10, 12].includes(duration)
}

export function validateShiftAssignment(assignment: ShiftAssignment): ValidationResult {
  const errors: string[] = []

  // Validate date format
  if (!isValidDateFormat(assignment.date)) {
    errors.push('Invalid date format: must be YYYY-MM-DD')
  }

  // Validate time formats
  if (!isValidTimeFormat(assignment.startTime)) {
    errors.push('Invalid time format: startTime must be in HH:mm format')
  }
  if (!isValidTimeFormat(assignment.endTime)) {
    errors.push('Invalid time format: endTime must be in HH:mm format')
  }

  // Validate shift duration
  if (isValidTimeFormat(assignment.startTime) && isValidTimeFormat(assignment.endTime)) {
    if (!isValidShiftDuration(assignment.startTime, assignment.endTime)) {
      errors.push('Invalid shift duration: must be either 4, 10, or 12 hours')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateSchedule(
  assignments: ShiftAssignment[],
  requirements: StaffingRequirement[]
): ValidationResult {
  const errors: string[] = []

  // Group assignments by date
  const assignmentsByDate = assignments.reduce((acc, assignment) => {
    if (!acc[assignment.date]) {
      acc[assignment.date] = []
    }
    acc[assignment.date].push(assignment)
    return acc
  }, {} as Record<string, ShiftAssignment[]>)

  // Check each date's assignments against requirements
  Object.entries(assignmentsByDate).forEach(([_date, dateAssignments]) => {
    requirements.forEach(requirement => {
      const { startTime, endTime, minEmployees, requiresSupervisor } = requirement

      // Count employees and supervisors during this time period
      const employeesInPeriod = dateAssignments.filter(assignment => {
        const assignmentStart = assignment.startTime
        const assignmentEnd = assignment.endTime

        // Check if the assignment overlaps with the requirement period
        if (assignmentEnd < startTime) return false
        if (assignmentStart > endTime) return false
        return true
      })

      const totalEmployees = employeesInPeriod.length
      const hasSupervisor = employeesInPeriod.some(a => a.isSupervisor)

      // Check minimum staffing requirement
      if (totalEmployees < minEmployees) {
        errors.push(
          `Insufficient staffing during ${startTime}-${endTime}: ${totalEmployees} employees scheduled, minimum ${minEmployees} required`
        )
      }

      // Check supervisor requirement
      if (requiresSupervisor && !hasSupervisor) {
        errors.push(`No supervisor scheduled during ${startTime}-${endTime}`)
      }
    })
  })

  return {
    isValid: errors.length === 0,
    errors
  }
} 