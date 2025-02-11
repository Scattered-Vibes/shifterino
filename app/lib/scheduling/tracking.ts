import type { Employee, ShiftOption } from '@/app/types'

export type WeeklyHoursTracking = Record<string, Record<string, number>>

export type ShiftPatternTracking = Record<string, {
  consecutive_shifts: number
  last_shift_end: Date | null
}>

export function initializeTracking(employeeIds: string[]): {
  weeklyHours: WeeklyHoursTracking
  shiftPatterns: ShiftPatternTracking
} {
  const weeklyHours: WeeklyHoursTracking = {}
  const shiftPatterns: ShiftPatternTracking = {}

  employeeIds.forEach(id => {
    weeklyHours[id] = {}
    shiftPatterns[id] = {
      consecutive_shifts: 0,
      last_shift_end: null
    }
  })

  return { weeklyHours, shiftPatterns }
}

export function updateWeeklyHours(
  tracking: WeeklyHoursTracking,
  employeeId: string,
  date: string,
  hours: number
): WeeklyHoursTracking {
  const weekStart = getWeekStartDate(date)
  const currentHours = tracking[employeeId]?.[weekStart] || 0

  return {
    ...tracking,
    [employeeId]: {
      ...tracking[employeeId],
      [weekStart]: currentHours + hours
    }
  }
}

export function updateShiftPattern(
  tracking: ShiftPatternTracking,
  employeeId: string,
  date: string
): ShiftPatternTracking {
  const employeeTracking = tracking[employeeId]
  const lastShiftEnd = employeeTracking.last_shift_end

  // Check if this is a consecutive shift
  const isConsecutive = lastShiftEnd
    ? (new Date(date).getTime() - lastShiftEnd.getTime()) <= 24 * 60 * 60 * 1000
    : false

  return {
    ...tracking,
    [employeeId]: {
      consecutive_shifts: isConsecutive ? employeeTracking.consecutive_shifts + 1 : 1,
      last_shift_end: new Date(date)
    }
  }
}

export function canAssignShift(
  employee: Employee,
  date: string,
  shiftOption: ShiftOption,
  weeklyHours: WeeklyHoursTracking,
  shiftPatterns: ShiftPatternTracking
): boolean {
  const weekStart = getWeekStartDate(date)
  const currentHours = weeklyHours[employee.id]?.[weekStart] || 0
  const pattern = shiftPatterns[employee.id]

  // Check weekly hours cap
  if (currentHours + shiftOption.duration_hours > employee.weekly_hours_cap) {
    if (!employee.max_overtime_hours || 
        currentHours + shiftOption.duration_hours > employee.weekly_hours_cap + employee.max_overtime_hours) {
      return false
    }
  }

  // Check consecutive shifts limit
  if (pattern.consecutive_shifts >= 4) {
    return false
  }

  // Check shift pattern rules
  if (employee.shift_pattern === 'pattern_a') {
    // Four consecutive 10-hour shifts
    if (shiftOption.duration_hours !== 10) {
      return false
    }
  } else if (employee.shift_pattern === 'pattern_b') {
    // Three consecutive 12-hour shifts plus one 4-hour shift
    if (pattern.consecutive_shifts === 3 && shiftOption.duration_hours !== 4) {
      return false
    }
    if (pattern.consecutive_shifts < 3 && shiftOption.duration_hours !== 12) {
      return false
    }
  }

  return true
}

function getWeekStartDate(date: string): string {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay()) // Set to Sunday
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
} 