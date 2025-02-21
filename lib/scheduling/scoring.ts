import { parseISO, differenceInHours } from 'date-fns'
import type {
  Employee,
  ShiftEvent,
  GenerationContext,
  ShiftCategory
} from '@/types/scheduling/schedule'
import type { GenerationContext as ShiftPattern } from '@/types/scheduling/schedule'
import { startOfWeek } from 'date-fns'
import { SHIFT_PATTERNS } from '@/types/shift-patterns'

/**
 * Core scoring factors for shift assignment
 */
interface ScoreFactors {
  hoursBalance: number    // Weekly hours balance (0-1)
  preference: number      // Shift preference match (0-1)
  restPeriod: number     // Rest period compliance (0-1)
}

const SCORE_WEIGHTS = {
  hoursBalance: 0.4,    // 40% weight for hours balance
  preference: 0.4,      // 40% weight for preference matching
  restPeriod: 0.2       // 20% weight for rest periods
}

/**
 * Calculates a score for assigning an employee to a shift
 * Returns a normalized score between 0-1 where higher is better
 */
export function calculateShiftScore(
  employee: Employee,
  shift: ShiftEvent,
  context: GenerationContext
): number {
  // Calculate individual factors
  const factors = {
    hoursBalance: calculateHoursBalance(employee, shift, context),
    preference: calculatePreference(employee, shift),
    restPeriod: calculateRestPeriod(employee, shift, context)
  }

  // Calculate weighted sum
  const score = Object.entries(SCORE_WEIGHTS).reduce((total, [factor, weight]) => {
    return total + (factors[factor as keyof ScoreFactors] * weight)
  }, 0)

  return Math.min(Math.max(score, 0), 1) // Normalize to 0-1
}

/**
 * Calculate score based on weekly hours balance (0-1)
 */
function calculateHoursBalance(
  employee: Employee,
  shift: ShiftEvent,
  context: GenerationContext
): number {
  const weeklyHours = getEmployeeWeeklyHours(context.weeklyHours, employee.id, shift.date)
  const shiftHours = differenceInHours(parseISO(shift.end), parseISO(shift.start))
  const projectedHours = weeklyHours + shiftHours
  const targetHours = employee.weekly_hours_cap

  // Perfect score at target hours
  if (projectedHours === targetHours) return 1

  // Penalize over/under hours
  const hoursDiff = Math.abs(targetHours - projectedHours)
  return Math.max(0, 1 - (hoursDiff / 20)) // Lose 0.05 per hour difference
}

/**
 * Calculate score based on shift preference match (0-1)
 */
function calculatePreference(
  employee: Employee,
  shift: ShiftEvent
): number {
  if (!employee.preferred_shift_category) return 1

  const shiftHour = parseISO(shift.start).getHours()
  const shiftCategory: ShiftCategory = 
    (shiftHour >= 5 && shiftHour < 15) ? 'DAY' :
    (shiftHour >= 13 && shiftHour < 23) ? 'SWING' : 'NIGHT'

  return shiftCategory === employee.preferred_shift_category ? 1 : 0.5
}

/**
 * Calculate score based on rest period compliance (0-1)
 */
function calculateRestPeriod(
  employee: Employee,
  shift: ShiftEvent,
  context: GenerationContext
): number {
  const pattern = context.shiftPatterns[employee.id]
  if (!pattern?.lastShiftEnd) return 1

  const hoursBetween = differenceInHours(
    parseISO(shift.start),
    parseISO(pattern.lastShiftEnd)
  )

  // Ideal rest period: 10-14 hours
  if (hoursBetween >= 10 && hoursBetween <= 14) return 1
  
  // Minimum rest period: 8 hours
  if (hoursBetween < 8) return 0
  
  // Gradually reduce score for longer gaps
  return Math.max(0, 1 - ((hoursBetween - 14) / 24))
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