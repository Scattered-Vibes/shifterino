import type { Employee } from '@/types/models/employee'
import type { ShiftOption } from '@/types/models/shift'
import type { GenerationContext, ShiftPattern } from '@/types/scheduling/schedule'
import { parseISO, isSameWeek, addDays, differenceInHours, format, startOfWeek, isSameDay, differenceInDays } from 'date-fns'

interface EmployeeTracking {
  consecutiveShifts: number
  weeklyHours: number
  lastShiftEnd: Date | null
}

const tracking = new Map<string, EmployeeTracking>()

export function initializeTracking(employees: Employee[]): {
  weeklyHours: Record<string, Record<string, number>>;
  shiftPatterns: Record<string, { consecutiveShifts: number; lastShiftEnd: Date | null, currentPattern: ShiftPattern }>;
} {
  const weeklyHours: Record<string, Record<string, number>> = {};
  const shiftPatterns: Record<string, { consecutiveShifts: number; lastShiftEnd: Date | null, currentPattern: ShiftPattern }> = {};

  for (const employee of employees) {
    weeklyHours[employee.id] = {};
    shiftPatterns[employee.id] = {
      consecutiveShifts: 0,
      lastShiftEnd: null,
      currentPattern: employee.shift_pattern as ShiftPattern,
    };
  }
  return { weeklyHours, shiftPatterns };
}

export function updateWeeklyHours(
  weeklyHours: Record<string, Record<string, number>>,
  employeeId: string, 
  dateStr: string,
  durationHours: number
) {
  const date = new Date(dateStr);

  if (!weeklyHours[employeeId]) {
    weeklyHours[employeeId] = {}
  }

  const weekStart = new Date(date)
  weekStart.setDate(date.getDate() - date.getDay())
  const weekStartStr = weekStart.toISOString().split('T')[0]

  if (!weeklyHours[employeeId][weekStartStr]) {
    weeklyHours[employeeId][weekStartStr] = 0
  }
  weeklyHours[employeeId][weekStartStr] += durationHours
  return weeklyHours;
}

export function updateShiftPattern(
  shiftPatterns: Record<string, ShiftPattern>,
  employeeId: string,
  dateStr: string,
  shiftOption: ShiftOption
): Record<string, ShiftPattern> {

  const date = new Date(dateStr);
  const employeePattern = shiftPatterns[employeeId]

  if (!employeePattern) return shiftPatterns

  const [hours, minutes] = shiftOption.end_time.split(':').map(Number)
  const shiftEnd = new Date(date)
  shiftEnd.setHours(hours, minutes, 0, 0)

  if (shiftOption.end_time <= shiftOption.start_time) {
    shiftEnd.setDate(shiftEnd.getDate() + 1)
  }

  if (employeePattern.lastShiftEnd) {
    const daysSinceLastShift = (date.getTime() - employeePattern.lastShiftEnd.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceLastShift > 1) {
      employeePattern.consecutiveShifts = 1
    } else if (daysSinceLastShift === 1) {
      employeePattern.consecutiveShifts++
    }
  } else {
    employeePattern.consecutiveShifts = 1
  }

  employeePattern.lastShiftEnd = shiftEnd
  shiftPatterns[employeeId] = employeePattern;
  return shiftPatterns;
}

export function canAssignShift(
  employee: Employee,
  shiftOption: ShiftOption,
  date: Date,
  context: GenerationContext
): boolean {
  const dateStr = format(date, 'yyyy-MM-dd')

  const hasTimeOff = context.timeOffRequests.some(
    (request) =>
      request.employee_id === employee.id &&
      request.status === 'approved' &&
      date >= parseISO(request.start_date) &&
      date <= parseISO(request.end_date)
  )

  if (hasTimeOff) return false

  const existingShift = context.existingShifts.find(
    (shift) =>
      shift.employee_id === employee.id &&
      isSameDay(parseISO(shift.date), date)
  )
  if (existingShift) return false

  const weekStart = startOfWeek(date)
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const currentWeeklyHours = context.weeklyHours[employee.id]?.[weekStartStr] || 0
  const maxHours = employee.weekly_hours_cap + (context.params.allowOvertime ? (employee.max_overtime_hours || 0) : 0)
  if (currentWeeklyHours + shiftOption.duration_hours > maxHours) {
    return false
  }

  const patternData = context.shiftPatterns[employee.id];

  const maxConsecutiveDays = employee.shift_pattern === '4x10' ? 4 : 4
  if (patternData && patternData.consecutiveShifts >= maxConsecutiveDays) {
    if (patternData.lastShiftEnd && differenceInDays(date, patternData.lastShiftEnd) === 0) {
      return false
    }
  }

  return true
}