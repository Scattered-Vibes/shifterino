import { type ShiftEvent, type ShiftPattern } from '@/types'

const PATTERNS: Record<ShiftPattern, { maxConsecutiveDays: number; minRestHours: number }> = {
  pattern_a: {
    maxConsecutiveDays: 4,
    minRestHours: 10
  },
  pattern_b: {
    maxConsecutiveDays: 3,
    minRestHours: 12
  },
  custom: {
    maxConsecutiveDays: 5,
    minRestHours: 8
  }
}

export function getWeeklyShifts(shifts: ShiftEvent[], event: ShiftEvent): ShiftEvent[] {
  const shiftStart = new Date(event.start)
  const shiftEnd = new Date(event.end)
  
  // Get start of week (Sunday)
  const weekStart = new Date(shiftStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)
  
  // Get end of week (Saturday)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  
  return shifts.filter(shift => {
    const start = new Date(shift.start)
    const end = new Date(shift.end)
    return start >= weekStart && end <= weekEnd && shift.employee_id === event.employee_id
  })
}

export function getConsecutiveShifts(shifts: ShiftEvent[], event: ShiftEvent): ShiftEvent[] {
  const shiftStart = new Date(event.start)
  
  // Get shifts within 24 hours before and after
  const rangeStart = new Date(shiftStart)
  rangeStart.setHours(rangeStart.getHours() - 24)
  
  const rangeEnd = new Date(shiftStart)
  rangeEnd.setHours(rangeEnd.getHours() + 24)
  
  return shifts
    .filter(shift => shift.employee_id === event.employee_id)
    .filter(shift => {
      const start = new Date(shift.start)
      return start >= rangeStart && start <= rangeEnd
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
}

export function validateShiftPattern(
  shifts: ShiftEvent[],
  event: ShiftEvent,
  pattern: ShiftPattern
): { isValid: boolean; message?: string } {
  const weeklyShifts = getWeeklyShifts(shifts, event)
  const consecutiveShifts = getConsecutiveShifts(shifts, event)
  
  // Calculate weekly hours
  const weeklyHours = weeklyShifts.reduce((total, shift) => {
    const start = new Date(shift.start)
    const end = new Date(shift.end)
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return total + hours
  }, 0)
  
  // Check weekly hours cap
  if (weeklyHours > 40) {
    return {
      isValid: false,
      message: `Weekly hours would exceed 40 (${Math.round(weeklyHours)} hours)`
    }
  }
  
  const patternRules = PATTERNS[pattern]
  
  // Check consecutive days
  if (consecutiveShifts.length >= patternRules.maxConsecutiveDays) {
    return {
      isValid: false,
      message: `Would exceed maximum of ${patternRules.maxConsecutiveDays} consecutive shifts`
    }
  }
  
  // Check minimum rest period
  if (consecutiveShifts.length > 0) {
    const lastShiftEnd = new Date(consecutiveShifts[consecutiveShifts.length - 1].end)
    const newShiftStart = new Date(event.start)
    const restHours = (newShiftStart.getTime() - lastShiftEnd.getTime()) / (1000 * 60 * 60)
    
    if (restHours < patternRules.minRestHours) {
      return {
        isValid: false,
        message: `Minimum rest period of ${patternRules.minRestHours} hours required between shifts`
      }
    }
  }
  
  return { isValid: true }
} 