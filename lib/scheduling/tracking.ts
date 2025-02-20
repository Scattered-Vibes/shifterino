import { parseISO, differenceInHours } from 'date-fns'
import type {
  Employee,
  ShiftOption,
  ShiftPatternState,
  GenerationContext
} from '@/types/scheduling/schedule'
import type { ShiftPattern, Holiday } from '@/types/shift-patterns'
import { SHIFT_PATTERNS } from '@/types/shift-patterns'

export function updateWeeklyHours(
  weeklyHours: Record<string, Record<string, number>>,
  employeeId: string,
  date: string,
  hours: number
): void {
  const weekStart = getWeekStart(date)
  if (!weeklyHours[employeeId]) {
    weeklyHours[employeeId] = {}
  }
  if (!weeklyHours[employeeId][weekStart]) {
    weeklyHours[employeeId][weekStart] = 0
  }
  weeklyHours[employeeId][weekStart] += hours
}

export function updateShiftPattern(
  patterns: Record<string, ShiftPatternState>,
  employeeId: string,
  date: string,
  shift: ShiftOption
): void {
  const pattern = patterns[employeeId]
  if (!pattern) return

  // Update consecutive shifts
  if (pattern.lastShiftEnd) {
    const lastEnd = parseISO(pattern.lastShiftEnd)
    const currentStart = parseISO(`${date}T${shift.startTime}:00.000Z`)
    const hoursBetween = differenceInHours(currentStart, lastEnd)

    if (hoursBetween <= 24) {
      pattern.consecutiveShifts++
    } else {
      pattern.consecutiveShifts = 1
    }
  } else {
    pattern.consecutiveShifts = 1
  }

  pattern.lastShiftEnd = `${date}T${shift.endTime}:00.000Z`
}

export function canAssignShift(
  employee: Employee,
  shift: ShiftOption,
  date: Date,
  context: GenerationContext
): boolean {
  const dateStr = date.toISOString().split('T')[0]
  const weekStart = getWeekStart(dateStr)
  const weeklyHours = context.weeklyHours[employee.id]?.[weekStart] || 0

  // Check weekly hours limit
  if (weeklyHours + shift.durationHours > employee.max_weekly_hours) {
    return false
  }

  // Check pattern constraints
  const pattern = context.shiftPatterns[employee.id]
  if (!pattern) return false

  if (pattern.lastShiftEnd) {
    const lastEnd = parseISO(pattern.lastShiftEnd)
    const currentStart = parseISO(`${dateStr}T${shift.startTime}:00.000Z`)
    const hoursBetween = differenceInHours(currentStart, lastEnd)

    // Minimum rest period
    if (hoursBetween < 8) {
      return false
    }

    // Maximum consecutive shifts
    const maxConsecutive = pattern.currentPattern === SHIFT_PATTERNS.PATTERN_A ? 4 : 3
    if (pattern.consecutiveShifts >= maxConsecutive) {
      return false
    }
  }

  return true
}

export function isHolidayDate(date: Date, holidays: Holiday[]): boolean {
  const dateStr = date.toISOString().split('T')[0]
  return holidays.some(holiday => holiday.date === dateStr)
}

export function convertEmployeePatternType(pattern: string): ShiftPattern {
  switch (pattern.toLowerCase()) {
    case '4x10':
    case 'pattern_a':
      return SHIFT_PATTERNS.PATTERN_A
    case '3x12':
    case 'pattern_b':
      return SHIFT_PATTERNS.PATTERN_B
    default:
      return SHIFT_PATTERNS.PATTERN_A
  }
}

function getWeekStart(dateStr: string): string {
  const date = parseISO(dateStr)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const weekStart = new Date(date.setDate(diff))
  return weekStart.toISOString().split('T')[0]
}