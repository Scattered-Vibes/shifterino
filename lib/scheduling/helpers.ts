import { format, parseISO, isWithinInterval, addHours, isSameDay, differenceInHours } from 'date-fns'
import type {
  Employee,
  ShiftOption,
  TimeOffRequest,
  StaffingRequirement,
  ShiftEvent,
  IndividualShift
} from '@/types/scheduling/schedule'
import type { Holiday } from '@/types/shift-patterns'

export function validateSchedulePeriod(startDate: Date, endDate: Date): boolean {
  return startDate <= endDate
}

export function getAvailableEmployees(
  employees: Employee[],
  date: Date,
  timeOffRequests: TimeOffRequest[]
): Employee[] {
  const dateStr = format(date, 'yyyy-MM-dd')
  
  return employees.filter(employee => {
    // Check if employee has approved time off for this date
    const hasTimeOff = timeOffRequests.some(request => 
      request.employeeId === employee.id &&
      request.status === 'approved' &&
      isWithinInterval(date, {
        start: parseISO(request.startDate),
        end: parseISO(request.endDate)
      })
    )
    
    return !hasTimeOff
  })
}

export function getApplicableRequirements(
  requirements: StaffingRequirement[],
  date: Date,
  isHoliday: boolean
): StaffingRequirement[] {
  // For now, return all requirements
  // TODO: Add holiday-specific requirements
  return requirements
}

export function getMatchingShiftOptions(
  options: ShiftOption[],
  requirement: StaffingRequirement
): ShiftOption[] {
  return options.filter(option => {
    const optionStart = parseTimeString(option.startTime)
    const optionEnd = parseTimeString(option.endTime)
    const reqStart = parseTimeString(requirement.timeBlockStart)
    const reqEnd = parseTimeString(requirement.timeBlockEnd)
    
    // Handle overnight shifts
    const optionDuration = (optionEnd < optionStart) 
      ? optionEnd + 1440 - optionStart 
      : optionEnd - optionStart
      
    return optionStart <= reqStart && (optionStart + optionDuration) >= reqEnd
  })
}

function parseTimeString(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

export interface ShiftConflict {
  type: 'overlap' | 'pattern' | 'hours' | 'rest'
  message: string
  shifts: ShiftEvent[]
}

export function detectShiftConflicts(
  shift: ShiftEvent,
  existingShifts: ShiftEvent[],
  employee: Employee
): ShiftConflict[] {
  const conflicts: ShiftConflict[] = []

  // Check for overlapping shifts
  const overlappingShifts = existingShifts.filter(existing => 
    existing.employeeId === shift.employeeId &&
    isShiftOverlap(shift, existing)
  )

  if (overlappingShifts.length > 0) {
    conflicts.push({
      type: 'overlap',
      message: 'Shift overlaps with existing shifts',
      shifts: overlappingShifts
    })
  }

  // Check pattern compliance
  const patternConflict = validateShiftPattern(shift, existingShifts, employee.shift_pattern)
  if (patternConflict) {
    conflicts.push(patternConflict)
  }

  // Check weekly hours
  const weeklyHoursConflict = validateWeeklyHours(shift, existingShifts, employee)
  if (weeklyHoursConflict) {
    conflicts.push(weeklyHoursConflict)
  }

  // Check minimum rest period
  const restPeriodConflict = validateRestPeriod(shift, existingShifts)
  if (restPeriodConflict) {
    conflicts.push(restPeriodConflict)
  }

  return conflicts
}

function isShiftOverlap(shift1: ShiftEvent, shift2: ShiftEvent): boolean {
  const start1 = new Date(shift1.start)
  const end1 = new Date(shift1.end)
  const start2 = new Date(shift2.start)
  const end2 = new Date(shift2.end)

  return start1 < end2 && end1 > start2
}

function validateShiftPattern(
  shift: ShiftEvent,
  existingShifts: ShiftEvent[],
  pattern: string
): ShiftConflict | null {
  const shiftDate = new Date(shift.start)
  const weekShifts = existingShifts.filter(existing => 
    isSameWeek(new Date(existing.start), shiftDate)
  )

  if (pattern === 'four_ten') {
    // Check for 4 consecutive 10-hour shifts
    const shiftHours = differenceInHours(new Date(shift.end), new Date(shift.start))
    if (shiftHours !== 10) {
      return {
        type: 'pattern',
        message: 'Shift must be exactly 10 hours for 4x10 pattern',
        shifts: [shift]
      }
    }

    if (weekShifts.length >= 4) {
      return {
        type: 'pattern',
        message: 'Cannot exceed 4 shifts per week in 4x10 pattern',
        shifts: weekShifts
      }
    }
  } else if (pattern === 'three_twelve') {
    // Check for 3 consecutive 12-hour shifts plus one 4-hour shift
    const shiftHours = differenceInHours(new Date(shift.end), new Date(shift.start))
    if (shiftHours !== 12 && shiftHours !== 4) {
      return {
        type: 'pattern',
        message: 'Shift must be either 12 hours or 4 hours for 3x12 pattern',
        shifts: [shift]
      }
    }

    const twelveHourShifts = weekShifts.filter(s => 
      differenceInHours(new Date(s.end), new Date(s.start)) === 12
    )
    const fourHourShifts = weekShifts.filter(s => 
      differenceInHours(new Date(s.end), new Date(s.start)) === 4
    )

    if (twelveHourShifts.length > 3 || fourHourShifts.length > 1) {
      return {
        type: 'pattern',
        message: 'Pattern requires exactly 3 twelve-hour shifts and 1 four-hour shift',
        shifts: weekShifts
      }
    }
  }

  return null
}

function validateWeeklyHours(
  shift: ShiftEvent,
  existingShifts: ShiftEvent[],
  employee: Employee
): ShiftConflict | null {
  const shiftDate = new Date(shift.start)
  const weekShifts = existingShifts.filter(existing => 
    isSameWeek(new Date(existing.start), shiftDate)
  )

  const totalHours = weekShifts.reduce((sum, existing) => 
    sum + differenceInHours(new Date(existing.end), new Date(existing.start)),
    differenceInHours(new Date(shift.end), new Date(shift.start))
  )

  if (totalHours > employee.weekly_hours_cap) {
    return {
      type: 'hours',
      message: `Weekly hours (${totalHours}) exceed maximum (${employee.weekly_hours_cap})`,
      shifts: [...weekShifts, shift]
    }
  }

  return null
}

function validateRestPeriod(
  shift: ShiftEvent,
  existingShifts: ShiftEvent[]
): ShiftConflict | null {
  const MIN_REST_HOURS = 8
  const shiftStart = new Date(shift.start)
  const shiftEnd = new Date(shift.end)

  // Find adjacent shifts
  const adjacentShifts = existingShifts.filter(existing => {
    const existingStart = new Date(existing.start)
    const existingEnd = new Date(existing.end)
    const hoursBefore = differenceInHours(shiftStart, existingEnd)
    const hoursAfter = differenceInHours(existingStart, shiftEnd)
    return (hoursBefore >= 0 && hoursBefore < MIN_REST_HOURS) ||
           (hoursAfter >= 0 && hoursAfter < MIN_REST_HOURS)
  })

  if (adjacentShifts.length > 0) {
    return {
      type: 'rest',
      message: `Insufficient rest period (minimum ${MIN_REST_HOURS} hours required)`,
      shifts: [...adjacentShifts, shift]
    }
  }

  return null
}

function isSameWeek(date1: Date, date2: Date): boolean {
  const d1 = startOfWeek(date1)
  const d2 = startOfWeek(date2)
  return d1.getTime() === d2.getTime()
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
} 