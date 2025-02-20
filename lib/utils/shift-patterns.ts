import type { ShiftEvent } from '@/types/scheduling/shift'
import type { ShiftPatternConfig } from '@/types/shift-patterns'
import type { Database } from '@/types/supabase/database'

const HOURS_IN_MS = 3600000
const DAY_IN_MS = 86400000

type DbShiftPattern = Database['public']['Enums']['shift_pattern']
const VALID_PATTERNS = ['4x10', '3x12_plus_4'] as const

interface ConversionResult {
  pattern: DbShiftPattern
  wasConverted: boolean
  originalPattern?: string
}

export const SHIFT_PATTERNS: Record<DbShiftPattern, ShiftPatternConfig> = {
  '4x10': {
    name: '4x10',
    shifts: [{ duration: 10, count: 4 }],
    totalHours: 40,
    consecutiveDays: 4
  },
  '3x12_plus_4': {
    name: '3x12_plus_4',
    shifts: [
      { duration: 12, count: 3 },
      { duration: 4, count: 1 }
    ],
    totalHours: 40,
    consecutiveDays: 4
  }
}

export function validateShiftPatternFormat(pattern: string): ConversionResult {
  // Early return if pattern is already valid
  if (VALID_PATTERNS.includes(pattern as DbShiftPattern)) {
    return {
      pattern: pattern as DbShiftPattern,
      wasConverted: false
    }
  }

  // Convert legacy formats
  let convertedPattern: DbShiftPattern
  switch (pattern) {
    case '4_10':
      convertedPattern = '4x10'
      break
    case '3_12_4':
    case '3_12_plus_4':
      convertedPattern = '3x12_plus_4'
      break
    default:
      convertedPattern = '4x10' // Default to 4x10 for unknown patterns
  }

  return {
    pattern: convertedPattern,
    wasConverted: true,
    originalPattern: pattern
  }
}

export function isValidShiftPattern(pattern: string): pattern is DbShiftPattern {
  return VALID_PATTERNS.includes(pattern as DbShiftPattern)
}

export const shiftPatterns = VALID_PATTERNS
export type { DbShiftPattern as ShiftPattern }

export function validateShiftPattern(
  shift: ShiftEvent,
  allShifts: ShiftEvent[]
): boolean {
  // Get all shifts for the same employee in the same week
  const employeeShifts = getEmployeeWeekShifts(shift, allShifts)
  
  // Check weekly hours cap (40 hours unless approved)
  if (!shift.overrideHoursCap && calculateTotalHours(employeeShifts) > 40) {
    return false
  }

  // Get the pattern for this shift
  const pattern = SHIFT_PATTERNS[shift.pattern]
  if (!pattern) return false

  // Sort shifts by start time to ensure proper sequence
  const sortedShifts = [...employeeShifts].sort((a, b) => 
    new Date(a.start).getTime() - new Date(b.start).getTime()
  )

  // Validate based on pattern type
  switch (pattern.name) {
    case '4x10':
      return validatePatternA(sortedShifts)
    case '3x12_plus_4':
      return validatePatternB(sortedShifts)
    default:
      return false
  }
}

function getEmployeeWeekShifts(
  shift: ShiftEvent,
  allShifts: ShiftEvent[]
): ShiftEvent[] {
  const shiftDate = new Date(shift.start)
  const weekStart = getWeekStart(shiftDate)
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY_IN_MS)

  return allShifts.filter(s => 
    s.employee_id === shift.employee_id &&
    new Date(s.start) >= weekStart &&
    new Date(s.start) < weekEnd
  )
}

function validatePatternA(shifts: ShiftEvent[]): boolean {
  if (shifts.length !== 4) return false

  // All shifts should be 10 hours
  const allTenHours = shifts.every(s => {
    const duration = new Date(s.end).getTime() - new Date(s.start).getTime()
    return Math.abs(duration - (10 * HOURS_IN_MS)) < 1000 // Allow 1 second tolerance
  })
  if (!allTenHours) return false

  // Shifts should be on consecutive days
  return areShiftsConsecutive(shifts)
}

function validatePatternB(shifts: ShiftEvent[]): boolean {
  if (shifts.length !== 4) return false

  // First three shifts should be 12 hours
  const firstThreeTwelveHours = shifts.slice(0, 3).every(s => {
    const duration = new Date(s.end).getTime() - new Date(s.start).getTime()
    return Math.abs(duration - (12 * HOURS_IN_MS)) < 1000 // Allow 1 second tolerance
  })
  if (!firstThreeTwelveHours) return false

  // Last shift should be 4 hours
  const lastShiftDuration = new Date(shifts[3].end).getTime() - new Date(shifts[3].start).getTime()
  const lastShiftFourHours = Math.abs(lastShiftDuration - (4 * HOURS_IN_MS)) < 1000
  if (!lastShiftFourHours) return false

  // First three shifts should be consecutive
  return areShiftsConsecutive(shifts.slice(0, 3))
}

function areShiftsConsecutive(shifts: ShiftEvent[]): boolean {
  for (let i = 1; i < shifts.length; i++) {
    const prevShiftDate = new Date(shifts[i - 1].start)
    const currShiftDate = new Date(shifts[i].start)
    
    // Check if shifts are on consecutive days
    if (
      currShiftDate.getDate() - prevShiftDate.getDate() !== 1 &&
      !(
        prevShiftDate.getDate() === getLastDayOfMonth(prevShiftDate) &&
        currShiftDate.getDate() === 1
      )
    ) {
      return false
    }
  }

  return true
}

function calculateTotalHours(shifts: ShiftEvent[]): number {
  return shifts.reduce((total, shift) => {
    const duration = new Date(shift.end).getTime() - new Date(shift.start).getTime()
    return total + (duration / HOURS_IN_MS)
  }, 0)
}

function getWeekStart(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  result.setDate(result.getDate() - result.getDay())
  return result
}

function getLastDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
} 