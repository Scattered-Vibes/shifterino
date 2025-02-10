import { WeeklyHoursTracking, ShiftPatternTracking, Employee, IndividualShift, ShiftOption } from '@/types/scheduling'

export function initializeTracking(employees: Employee[]): {
  weeklyHours: WeeklyHoursTracking
  shiftPatterns: ShiftPatternTracking
} {
  const weeklyHours: WeeklyHoursTracking = {}
  const shiftPatterns: ShiftPatternTracking = {}

  employees.forEach(employee => {
    weeklyHours[employee.id] = {}
    shiftPatterns[employee.id] = {
      currentPattern: employee.shift_pattern,
      consecutiveDays: 0,
      lastShiftDate: null
    }
  })

  return { weeklyHours, shiftPatterns }
}

export function getWeekStartDate(date: string): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  const weekStart = new Date(d.setDate(diff))
  return weekStart.toISOString().split('T')[0]
}

export function updateWeeklyHours(
  tracking: WeeklyHoursTracking,
  employeeId: string,
  date: string,
  hours: number
): WeeklyHoursTracking {
  const weekStart = getWeekStartDate(date)
  const currentHours = tracking[employeeId][weekStart] || 0
  
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
  const lastDate = employeeTracking.lastShiftDate
  
  // Check if this is a consecutive day
  const isConsecutive = lastDate 
    ? (new Date(date).getTime() - new Date(lastDate).getTime()) === 24 * 60 * 60 * 1000 
    : true

  const consecutiveDays = isConsecutive ? employeeTracking.consecutiveDays + 1 : 1

  return {
    ...tracking,
    [employeeId]: {
      ...employeeTracking,
      consecutiveDays,
      lastShiftDate: date
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
  const currentHours = weeklyHours[employee.id][weekStart] || 0
  const pattern = shiftPatterns[employee.id]

  // Check weekly hours cap
  if (currentHours + shiftOption.duration_hours > employee.weekly_hours_cap) {
    if (!employee.max_overtime_hours || 
        currentHours + shiftOption.duration_hours > employee.weekly_hours_cap + employee.max_overtime_hours) {
      return false
    }
  }

  // Check shift pattern constraints
  if (pattern.currentPattern === 'PATTERN_A') {
    // Four consecutive 10-hour shifts
    if (shiftOption.duration_hours !== 10 || pattern.consecutiveDays >= 4) {
      return false
    }
  } else {
    // Three consecutive 12-hour shifts plus one 4-hour shift
    if (pattern.consecutiveDays >= 4) {
      return false
    }
    if (pattern.consecutiveDays === 3 && shiftOption.duration_hours !== 4) {
      return false
    }
    if (pattern.consecutiveDays < 3 && shiftOption.duration_hours !== 12) {
      return false
    }
  }

  return true
} 