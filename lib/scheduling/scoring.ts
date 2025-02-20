import { parseISO, differenceInHours } from 'date-fns'
import type {
  Employee,
  ShiftEvent,
  GenerationContext
} from '@/types/scheduling/schedule'
import type { GenerationContext as ShiftPattern } from '@/types/scheduling/schedule'
import { startOfWeek } from 'date-fns'
import { SHIFT_PATTERNS } from '@/types/shift-patterns'

interface ScoreFactors {
  hoursBalance: number      // How well this balances weekly hours
  patternAdherence: number  // How well this follows the employee's pattern
  preferenceMatch: number   // How well this matches employee preferences
  skillMatch: number        // How well skills match requirements
  fairnessScore: number     // Distribution of desirable/undesirable shifts
}

const SCORE_WEIGHTS = {
  hoursBalance: 0.3,      // 30% weight for hours balance
  patternAdherence: 0.25, // 25% weight for pattern adherence
  preferenceMatch: 0.2,   // 20% weight for preference matching
  skillMatch: 0.15,       // 15% weight for skill matching
  fairnessScore: 0.1      // 10% weight for fairness
}

/**
 * Calculates a score for assigning an employee to a shift
 * Higher scores indicate better matches
 */
export function calculateShiftScore(
  employee: Employee,
  shift: ShiftEvent,
  context: GenerationContext
): number {
  let score = 0

  // Base score for all employees
  score += 10

  // Prefer employees with fewer hours this week
  const weeklyHours = getEmployeeWeeklyHours(context.weeklyHours, employee.id, shift.start)
  score += (40 - weeklyHours) * 0.5

  // Prefer employees following their pattern
  if (shift.pattern === employee.shift_pattern) {
    score += 5
  }

  // Prefer supervisors for supervisor-required shifts
  if (employee.role === 'supervisor') {
    score += 3
  }

  // Consider consecutive shifts
  const pattern = context.shiftPatterns[employee.id]
  if (pattern.lastShiftEnd) {
    const lastEnd = parseISO(pattern.lastShiftEnd)
    const currentStart = parseISO(shift.start)
    const hoursBetween = differenceInHours(currentStart, lastEnd)

    // Prefer shifts that maintain proper rest periods
    if (hoursBetween >= 8 && hoursBetween <= 16) {
      score += 2
    }
  }

  return score
}

function getEmployeeWeeklyHours(
  weeklyHours: Record<string, Record<string, number>>,
  employeeId: string,
  date: string
): number {
  const weekStart = getWeekStart(date)
  return weeklyHours[employeeId]?.[weekStart] || 0
}

function getWeekStart(dateStr: string): string {
  const date = parseISO(dateStr)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const weekStart = new Date(date.setDate(diff))
  return weekStart.toISOString().split('T')[0]
}

function calculateScoreFactors(
  employee: Employee,
  shift: ShiftEvent,
  context: GenerationContext
): ScoreFactors {
  return {
    hoursBalance: calculateHoursBalanceScore(employee, shift, context),
    patternAdherence: calculatePatternAdherenceScore(employee, shift, context),
    preferenceMatch: calculatePreferenceMatchScore(employee, shift, context),
    skillMatch: calculateSkillMatchScore(employee, shift, context),
    fairnessScore: calculateFairnessScore(employee, shift, context)
  }
}

function calculateHoursBalanceScore(
  employee: Employee,
  shift: ShiftEvent,
  context: GenerationContext
): number {
  const weekStart = startOfWeek(parseISO(shift.date))
  const currentWeeklyHours = context.weeklyHours[employee.id]?.[weekStart.toISOString()] || 0
  const shiftHours = differenceInHours(parseISO(shift.end), parseISO(shift.start))
  const projectedHours = currentWeeklyHours + shiftHours
  const maxHours = employee.weekly_hours_cap

  // Perfect score for hitting exactly the employee's weekly hours cap
  if (projectedHours === maxHours) return 1

  // Penalize more heavily for going over cap than under
  if (projectedHours > maxHours) {
    return Math.max(0, 1 - ((projectedHours - maxHours) / 10)) // Lose 0.1 per hour over cap
  }

  // Smaller penalty for being under cap
  return Math.max(0, 1 - ((maxHours - projectedHours) / 20)) // Lose 0.05 per hour under cap
}

function calculatePatternAdherenceScore(
  employee: Employee,
  shift: ShiftEvent,
  context: GenerationContext
): number {
  const employeePattern = context.shiftPatterns[employee.id]
  if (!employeePattern) return 1 // No pattern yet, any shift is fine

  // Check if this shift matches the employee's current pattern
  if (employeePattern.currentPattern === shift.pattern) {
    return 1
  }

  // Penalize pattern switches
  return 0.5
}

function calculatePreferenceMatchScore(
  employee: Employee,
  shift: ShiftEvent,
  context: GenerationContext
): number {
  let score = 1
  const shiftStart = parseISO(shift.start)
  const shiftHour = shiftStart.getHours()

  // Match against preferred shift category
  if (employee.preferred_shift_category) {
    const isPreferredCategory = (
      (shiftHour >= 5 && shiftHour < 15 && employee.preferred_shift_category === 'DAY') ||
      (shiftHour >= 13 && shiftHour < 23 && employee.preferred_shift_category === 'SWING') ||
      ((shiftHour >= 21 || shiftHour < 7) && employee.preferred_shift_category === 'NIGHT')
    )
    score *= isPreferredCategory ? 1 : 0.7
  }

  return score
}

function calculateSkillMatchScore(
  employee: Employee,
  shift: ShiftEvent,
  context: GenerationContext
): number {
  let score = 1

  // Example skill matching (expand based on your requirements)
  const requirement = context.staffingRequirements.find(req => {
    const reqStart = parseISO(req.start_time)
    const reqEnd = parseISO(req.end_time)
    const shiftStart = parseISO(shift.start)
    return shiftStart >= reqStart && shiftStart < reqEnd
  })

  if (requirement) {
    // Check if employee meets minimum requirements
    if (requirement.min_supervisors > 0 && employee.role !== 'supervisor') {
      score *= 0.5
    }
  }

  return score
}

function calculateFairnessScore(
  employee: Employee,
  shift: ShiftEvent,
  context: GenerationContext
): number {
  let score = 1
  const shiftStart = parseISO(shift.start)
  const shiftHour = shiftStart.getHours()

  // Consider shift desirability
  const isUndesirableShift = shiftHour < 6 || shiftHour > 22 // Night shifts
  if (isUndesirableShift) {
    // Check historical distribution
    const undesirableShiftCount = context.existingShifts.filter(s => {
      const hour = parseISO(s.start).getHours()
      return s.employee_id === employee.id && (hour < 6 || hour > 22)
    }).length

    // Higher score for employees with fewer undesirable shifts
    score *= Math.max(0.5, 1 - (undesirableShiftCount * 0.1))
  }

  // Consider holidays
  const isHoliday = context.holidays.some(h => h.date === shift.date)
  if (isHoliday) {
    const holidayShiftCount = context.existingShifts.filter(s =>
      context.holidays.some(h => h.date === s.date) && s.employee_id === employee.id
    ).length

    // Higher score for employees with fewer holiday shifts
    score *= Math.max(0.5, 1 - (holidayShiftCount * 0.1))
  }

  return score
} 