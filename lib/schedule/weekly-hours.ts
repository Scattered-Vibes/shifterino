import { ShiftAssignment, ValidationResult } from '@/types/schedule'
import { parseISO, startOfWeek } from 'date-fns'

const MAX_WEEKLY_HOURS = 40

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

export function calculateWeeklyHours(assignments: ShiftAssignment[]): number {
  let totalHours = 0

  assignments.forEach(assignment => {
    const duration = getShiftDuration(assignment.startTime, assignment.endTime)
    totalHours += duration
  })

  return totalHours
}

export function validateWeeklyHours(
  assignments: ShiftAssignment[],
  overtimeApproved = false
): ValidationResult {
  const errors: string[] = []

  // Group assignments by week
  const weeklyAssignments = new Map<string, ShiftAssignment[]>()

  assignments.forEach(assignment => {
    const date = parseISO(assignment.date)
    const weekStart = startOfWeek(date, { weekStartsOn: 0 }) // Sunday
    const weekKey = weekStart.toISOString()

    if (!weeklyAssignments.has(weekKey)) {
      weeklyAssignments.set(weekKey, [])
    }
    weeklyAssignments.get(weekKey)?.push(assignment)
  })

  // Check each week's hours
  weeklyAssignments.forEach((weekAssignments, _weekKey) => {
    const weeklyHours = calculateWeeklyHours(weekAssignments)

    if (!overtimeApproved && weeklyHours > MAX_WEEKLY_HOURS) {
      errors.push(`Weekly hours (${weeklyHours}) exceed maximum allowed (${MAX_WEEKLY_HOURS})`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
} 