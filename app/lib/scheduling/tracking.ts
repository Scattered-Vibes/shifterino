import { type Employee } from '@/types/models/employee'
import { type ShiftOption } from '@/types/models/shift'
import { type GenerationContext } from '@/types/scheduling/schedule'
import { addDays, differenceInHours, isSameWeek, parseISO } from 'date-fns'

interface EmployeeTracking {
  consecutiveShifts: number
  weeklyHours: number
  lastShiftEnd: Date | null
  assignedShifts: number
}

interface TrackingState {
  weeklyHours: Record<string, Record<string, number>>
  shiftPatterns: Record<string, {
    consecutiveShifts: number
    lastShiftEnd: Date | null
  }>
}

const tracking = new Map<string, EmployeeTracking>()

export function initializeTracking(employees: Employee[]): TrackingState {
  tracking.clear()
  const weeklyHours: Record<string, Record<string, number>> = {}
  const shiftPatterns: Record<string, { consecutiveShifts: number; lastShiftEnd: Date | null }> = {}

  employees.forEach(employee => {
    tracking.set(employee.id, {
      consecutiveShifts: employee.consecutive_shifts_count || 0,
      weeklyHours: employee.total_hours_current_week || 0,
      lastShiftEnd: employee.last_shift_date ? new Date(employee.last_shift_date) : null,
      assignedShifts: 0
    })

    weeklyHours[employee.id] = {}
    shiftPatterns[employee.id] = {
      consecutiveShifts: employee.consecutive_shifts_count || 0,
      lastShiftEnd: employee.last_shift_date ? new Date(employee.last_shift_date) : null
    }
  })

  return { weeklyHours, shiftPatterns }
}

export function updateWeeklyHours(
  employee: Employee,
  shift: ShiftOption,
  date: Date
): void {
  const employeeTracking = tracking.get(employee.id)
  if (!employeeTracking) return

  // Reset weekly hours if this is a new week
  if (employeeTracking.lastShiftEnd && !isSameWeek(date, employeeTracking.lastShiftEnd)) {
    employeeTracking.weeklyHours = 0
  }

  employeeTracking.weeklyHours += shift.durationHours
  tracking.set(employee.id, employeeTracking)
}

export function updateShiftPattern(
  employee: Employee,
  shift: ShiftOption,
  date: Date
): void {
  const employeeTracking = tracking.get(employee.id)
  if (!employeeTracking) return

  // Update consecutive shifts
  if (employeeTracking.lastShiftEnd) {
    const hoursSinceLastShift = differenceInHours(date, employeeTracking.lastShiftEnd)
    if (hoursSinceLastShift <= 24) {
      employeeTracking.consecutiveShifts++
    } else {
      employeeTracking.consecutiveShifts = 1
    }
  } else {
    employeeTracking.consecutiveShifts = 1
  }

  // Update last shift end time
  const shiftEnd = new Date(date)
  const [hours, minutes] = shift.endTime.split(':').map(Number)
  shiftEnd.setHours(hours, minutes)
  employeeTracking.lastShiftEnd = shiftEnd

  // Update assigned shifts count
  employeeTracking.assignedShifts++

  tracking.set(employee.id, employeeTracking)
}

export function canAssignShift(
  employee: Employee,
  shift: ShiftOption,
  date: Date,
  context: GenerationContext
): boolean {
  const employeeTracking = tracking.get(employee.id)
  if (!employeeTracking) return false

  // 1. Check weekly hours
  const projectedWeeklyHours = employeeTracking.weeklyHours + shift.durationHours
  const maxHours = employee.weekly_hours_cap + (context.params.allowOvertime ? (employee.max_overtime_hours || 0) : 0)
  if (projectedWeeklyHours > maxHours) {
    return false
  }

  // 2. Check consecutive shifts
  const maxConsecutiveShifts = employee.shift_pattern === 'pattern_a' ? 4 : 3
  if (employeeTracking.consecutiveShifts >= maxConsecutiveShifts) {
    return false
  }

  // 3. Check rest period
  if (employeeTracking.lastShiftEnd) {
    const shiftStart = new Date(date)
    const [hours, minutes] = shift.startTime.split(':').map(Number)
    shiftStart.setHours(hours, minutes)
    
    const restHours = differenceInHours(shiftStart, employeeTracking.lastShiftEnd)
    if (restHours < 8) { // Minimum 8 hours rest
      return false
    }
  }

  return true
}

export function getEmployeeStats(employeeId: string): EmployeeTracking | undefined {
  return tracking.get(employeeId)
} 