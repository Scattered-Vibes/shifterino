import { ShiftEvent } from '@/types/shift'

const HOURS_IN_MS = 3600000
const DAY_IN_MS = 86400000

interface ShiftPattern {
  name: 'PATTERN_A' | 'PATTERN_B'
  shifts: {
    duration: number // in hours
    count: number
  }[]
}

export const SHIFT_PATTERNS: Record<string, ShiftPattern> = {
  PATTERN_A: {
    name: 'PATTERN_A',
    shifts: [{ duration: 10, count: 4 }] // Four 10-hour shifts
  },
  PATTERN_B: {
    name: 'PATTERN_B',
    shifts: [
      { duration: 12, count: 3 }, // Three 12-hour shifts
      { duration: 4, count: 1 }   // One 4-hour shift
    ]
  }
}

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

  // Check if shifts follow either Pattern A or Pattern B
  return (
    validatePatternA(employeeShifts) ||
    validatePatternB(employeeShifts)
  )
}

function getEmployeeWeekShifts(
  shift: ShiftEvent,
  allShifts: ShiftEvent[]
): ShiftEvent[] {
  const shiftDate = new Date(shift.start)
  const weekStart = getWeekStart(shiftDate)
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY_IN_MS)

  return allShifts.filter(s => 
    s.employeeId === shift.employeeId &&
    new Date(s.start) >= weekStart &&
    new Date(s.start) < weekEnd
  )
}

function validatePatternA(shifts: ShiftEvent[]): boolean {
  if (shifts.length !== 4) return false

  // All shifts should be 10 hours
  const allTenHours = shifts.every(s => 
    Math.abs(new Date(s.end).getTime() - new Date(s.start).getTime()) === 10 * HOURS_IN_MS
  )
  if (!allTenHours) return false

  // Shifts should be on consecutive days
  return areShiftsConsecutive(shifts)
}

function validatePatternB(shifts: ShiftEvent[]): boolean {
  if (shifts.length !== 4) return false

  // Sort shifts by start time
  const sortedShifts = [...shifts].sort((a, b) => 
    new Date(a.start).getTime() - new Date(b.start).getTime()
  )

  // First three shifts should be 12 hours
  const firstThreeTwelveHours = sortedShifts.slice(0, 3).every(s =>
    Math.abs(new Date(s.end).getTime() - new Date(s.start).getTime()) === 12 * HOURS_IN_MS
  )
  if (!firstThreeTwelveHours) return false

  // Last shift should be 4 hours
  const lastShiftFourHours = 
    Math.abs(new Date(sortedShifts[3].end).getTime() - new Date(sortedShifts[3].start).getTime()) === 4 * HOURS_IN_MS
  if (!lastShiftFourHours) return false

  // First three shifts should be consecutive
  return areShiftsConsecutive(sortedShifts.slice(0, 3))
}

function areShiftsConsecutive(shifts: ShiftEvent[]): boolean {
  const sortedShifts = [...shifts].sort((a, b) => 
    new Date(a.start).getTime() - new Date(b.start).getTime()
  )

  for (let i = 1; i < sortedShifts.length; i++) {
    const prevShiftDate = new Date(sortedShifts[i - 1].start)
    const currShiftDate = new Date(sortedShifts[i].start)
    
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