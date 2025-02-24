import type { Schedule } from '@/types/scheduling/schedule'
import { parseISO, differenceInHours, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'
import { parseTimeString, doesShiftCrossMidnight } from './helpers'

interface ValidationResult {
  isValid: boolean
  errors?: string[]
}

export async function validateSchedule(schedule: Schedule[]): Promise<ValidationResult> {
  const errors: string[] = []

  // Group shifts by employee
  const employeeShifts = schedule.reduce((acc, shift) => {
    if (!acc[shift.employee_id]) {
      acc[shift.employee_id] = []
    }
    acc[shift.employee_id].push(shift)
    return acc
  }, {} as Record<string, Schedule[]>)

  // Validate each employee's schedule
  for (const [employee_id, shifts] of Object.entries(employeeShifts)) {
    // Sort shifts by date and start time
    const sortedShifts = shifts.sort((a, b) => {
      const dateA = parseISO(a.date)
      const dateB = parseISO(b.date)
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime()
      }
      return parseTimeString(a.start_time) - parseTimeString(b.start_time)
    })

    // Check weekly hours
    const weeklyHoursResult = validateWeeklyHours(sortedShifts)
    if (!weeklyHoursResult.isValid) {
      errors.push(...weeklyHoursResult.errors!)
    }

    // Check minimum rest between shifts
    const restResult = validateRestPeriods(sortedShifts)
    if (!restResult.isValid) {
      errors.push(...restResult.errors!)
    }

    // Check for overlapping shifts
    const overlapResult = validateShiftOverlaps(sortedShifts)
    if (!overlapResult.isValid) {
      errors.push(...overlapResult.errors!)
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

function validateWeeklyHours(shifts: Schedule[]): ValidationResult {
  const errors: string[] = []
  const weeklyHours: Record<string, number> = {}

  for (const shift of shifts) {
    const shiftDate = parseISO(shift.date)
    const weekStart = startOfWeek(shiftDate).toISOString()
    
    if (!weeklyHours[weekStart]) {
      weeklyHours[weekStart] = 0
    }

    const startTime = parseTimeString(shift.start_time)
    let endTime = parseTimeString(shift.end_time)
    
    // Handle overnight shifts
    if (endTime < startTime) {
      endTime += 24 * 60
    }

    const hours = (endTime - startTime) / 60
    weeklyHours[weekStart] += hours

    if (weeklyHours[weekStart] > 40 && !shift.overtime_approved) {
      errors.push(
        `Employee ${shift.employee_id} exceeds 40 hours in week of ${weekStart} (${Math.round(weeklyHours[weekStart])} hours)`
      )
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

function validateRestPeriods(shifts: Schedule[]): ValidationResult {
  const errors: string[] = []
  const MIN_REST_HOURS = 8

  for (let i = 0; i < shifts.length - 1; i++) {
    const currentShift = shifts[i]
    const nextShift = shifts[i + 1]

    // Calculate end time of current shift
    const currentDate = parseISO(currentShift.date)
    let currentEnd = new Date(currentDate)
    const [endHours, endMinutes] = currentShift.end_time.split(':').map(Number)
    currentEnd.setHours(endHours, endMinutes)

    // If shift crosses midnight, add a day
    if (doesShiftCrossMidnight(currentShift.start_time, currentShift.end_time)) {
      currentEnd.setDate(currentEnd.getDate() + 1)
    }

    // Calculate start time of next shift
    const nextDate = parseISO(nextShift.date)
    const nextStart = new Date(nextDate)
    const [startHours, startMinutes] = nextShift.start_time.split(':').map(Number)
    nextStart.setHours(startHours, startMinutes)

    const restHours = differenceInHours(nextStart, currentEnd)
    if (restHours < MIN_REST_HOURS) {
      errors.push(
        `Employee ${currentShift.employee_id} has insufficient rest between shifts on ${currentShift.date} and ${nextShift.date} (${restHours} hours)`
      )
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

function validateShiftOverlaps(shifts: Schedule[]): ValidationResult {
  const errors: string[] = []

  for (let i = 0; i < shifts.length - 1; i++) {
    const currentShift = shifts[i]
    const nextShift = shifts[i + 1]

    // If shifts are on different days and neither crosses midnight, they can't overlap
    if (
      currentShift.date !== nextShift.date &&
      !doesShiftCrossMidnight(currentShift.start_time, currentShift.end_time) &&
      !doesShiftCrossMidnight(nextShift.start_time, nextShift.end_time)
    ) {
      continue
    }

    const currentStart = parseTimeString(currentShift.start_time)
    let currentEnd = parseTimeString(currentShift.end_time)
    const nextStart = parseTimeString(nextShift.start_time)
    let nextEnd = parseTimeString(nextShift.end_time)

    // Handle overnight shifts
    if (currentEnd < currentStart) currentEnd += 24 * 60
    if (nextEnd < nextStart) nextEnd += 24 * 60

    // Check for overlap
    if (currentStart < nextEnd && nextStart < currentEnd) {
      errors.push(
        `Employee ${currentShift.employee_id} has overlapping shifts on ${currentShift.date} (${currentShift.start_time}-${currentShift.end_time} and ${nextShift.start_time}-${nextShift.end_time})`
      )
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
} 