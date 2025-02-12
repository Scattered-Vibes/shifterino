import { type ShiftEvent, type Employee, type ShiftOption } from '@/types'
import { type IndividualShift } from '@/types/models/shift'
import { type GenerationContext } from '@/types/scheduling/schedule'
import { differenceInHours, parseISO } from 'date-fns'

export interface ScoreWeights {
  preferredCategory: number
  timeSinceLastShift: number
  weeklyHoursBalance: number
  restPeriod: number
  shiftPatternCompliance: number
  historicalFairness: number
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  preferredCategory: 30,
  timeSinceLastShift: 20,
  weeklyHoursBalance: 15,
  restPeriod: 20,
  shiftPatternCompliance: 10,
  historicalFairness: 5
}

export interface ScoreFactors {
  preferredCategoryScore: number
  timeSinceLastShiftScore: number
  weeklyHoursBalanceScore: number
  restPeriodScore: number
  shiftPatternComplianceScore: number
  historicalFairnessScore: number
}

export interface ScoredEmployee {
  employee: Employee
  shiftOption: ShiftOption
  score: number
  factors: ScoreFactors
}

const MIN_REST_HOURS = 8
const OPTIMAL_REST_HOURS = 12
const MAX_CONSECUTIVE_DAYS = 6

export function calculateShiftScore(
  employee: Employee,
  shift: ShiftOption,
  date: Date,
  context: GenerationContext
): number {
  let totalScore = 0

  // 1. Preferred shift category match
  if (employee.preferred_shift_category === shift.category) {
    totalScore += DEFAULT_WEIGHTS.preferredCategory
  }

  // 2. Shift pattern match
  const patternScore = calculatePatternScore(employee, shift, date, context)
  totalScore += patternScore * DEFAULT_WEIGHTS.shiftPatternCompliance

  // 3. Rest period adequacy
  const restScore = calculateRestScore(employee, shift, date, context)
  totalScore += restScore * DEFAULT_WEIGHTS.restPeriod

  // 4. Weekly hours balance
  const hoursScore = calculateHoursScore(employee, shift, context)
  totalScore += hoursScore * DEFAULT_WEIGHTS.weeklyHoursBalance

  // 5. Fairness (based on recent assignments)
  const fairnessScore = calculateFairnessScore(employee, context)
  totalScore += fairnessScore * DEFAULT_WEIGHTS.historicalFairness

  return Math.round(totalScore)
}

function calculatePatternScore(
  employee: Employee,
  shift: ShiftOption,
  date: Date,
  context: GenerationContext
): number {
  // Calculate how well this shift fits the employee's pattern
  // Returns a value between 0 and 1
  return 1 // Placeholder - implement actual pattern matching logic
}

function calculateRestScore(
  employee: Employee,
  shift: ShiftOption,
  date: Date,
  context: GenerationContext
): number {
  // Find employee's last shift
  const lastShift = findLastShift(employee, context)
  if (!lastShift) return 1 // No previous shift, maximum rest score

  const lastShiftEnd = parseISO(lastShift.actualEndTime || lastShift.endTime)
  const nextShiftStart = new Date(date)
  nextShiftStart.setHours(parseInt(shift.startTime.split(':')[0]))
  nextShiftStart.setMinutes(parseInt(shift.startTime.split(':')[1]))

  const restHours = differenceInHours(nextShiftStart, lastShiftEnd)
  
  // Score based on rest period (assuming minimum 8 hours, optimal 12 hours)
  if (restHours < MIN_REST_HOURS) return 0
  if (restHours >= OPTIMAL_REST_HOURS) return 1
  return (restHours - MIN_REST_HOURS) / (OPTIMAL_REST_HOURS - MIN_REST_HOURS)
}

function calculateHoursScore(
  employee: Employee,
  shift: ShiftOption,
  context: GenerationContext
): number {
  const currentWeeklyHours = employee.total_hours_current_week || 0
  const shiftHours = shift.durationHours

  // Perfect score if adding this shift keeps weekly hours within target
  if (currentWeeklyHours + shiftHours <= employee.weekly_hours_cap) {
    return 1
  }

  // Reduced score if overtime is needed but allowed
  if (context.params.allowOvertime && 
      currentWeeklyHours + shiftHours <= employee.weekly_hours_cap + (employee.max_overtime_hours || 0)) {
    return 0.5
  }

  return 0
}

function calculateFairnessScore(
  employee: Employee,
  context: GenerationContext
): number {
  // Calculate score based on how many shifts this employee has compared to others
  // Returns a value between 0 and 1
  return 1 // Placeholder - implement actual fairness calculation
}

function findLastShift(employee: Employee, context: GenerationContext) {
  // Find the employee's most recent shift
  // Returns undefined if no previous shift found
  return undefined // Placeholder - implement actual last shift lookup
}

function getConsecutiveShifts(
  employeeId: string,
  date: string,
  shifts: ShiftEvent[]
): ShiftEvent[] {
  const targetDate = new Date(date)
  const filteredShifts = shifts
    .filter(shift => shift.employee_id === employeeId)
    .sort((a, b) => b.start.getTime() - a.start.getTime())

  const consecutive: ShiftEvent[] = []
  let currentDate = targetDate

  for (const shift of filteredShifts) {
    const shiftDate = new Date(shift.start)
    const dayDiff = Math.abs((currentDate.getTime() - shiftDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (dayDiff <= 1) {
      consecutive.push(shift)
      currentDate = shiftDate
    } else {
      break
    }
  }

  return consecutive
}

function calculatePreferredCategoryScore(employee: Employee, shiftOption: ShiftOption): number {
  if (!employee.preferred_shift_category || !shiftOption.category) return 0.5
  return employee.preferred_shift_category === shiftOption.category ? 1 : 0
}

function calculateTimeSinceLastShiftScore(
  employee: Employee,
  date: string,
  shifts: ShiftEvent[]
): number {
  const lastShift = shifts
    .filter(shift => shift.employee_id === employee.id)
    .sort((a, b) => b.start.getTime() - a.start.getTime())[0]

  if (!lastShift) return 1 // No previous shifts, highest score

  const shiftStart = new Date(date)
  const hoursSinceLastShift = (shiftStart.getTime() - lastShift.end.getTime()) / (1000 * 60 * 60)

  if (hoursSinceLastShift < MIN_REST_HOURS) return 0
  if (hoursSinceLastShift >= OPTIMAL_REST_HOURS) return 1

  return (hoursSinceLastShift - MIN_REST_HOURS) / (OPTIMAL_REST_HOURS - MIN_REST_HOURS)
}

function calculateWeeklyHoursBalanceScore(
  employee: Employee,
  shiftOption: ShiftOption,
  date: string,
  shifts: ShiftEvent[]
): number {
  const weekStart = new Date(date)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  
  const weeklyHours = shifts
    .filter(shift => 
      shift.employee_id === employee.id &&
      shift.start >= weekStart &&
      shift.start < new Date(date)
    )
    .reduce((total, shift) => {
      const duration = (shift.end.getTime() - shift.start.getTime()) / (1000 * 60 * 60)
      return total + duration
    }, 0)

  const projectedHours = weeklyHours + shiftOption.duration_hours
  
  if (projectedHours > employee.weekly_hours_cap) {
    return employee.max_overtime_hours ? 0.2 : 0 // Small score if overtime allowed, zero if not
  }

  // Optimal is between 32-40 hours
  if (projectedHours >= 32 && projectedHours <= 40) return 1
  if (projectedHours < 32) return projectedHours / 32
  return Math.max(0, 1 - ((projectedHours - 40) / 8)) // Decreasing score for hours over 40
}

function calculateRestPeriodScore(
  date: string,
  shiftOption: ShiftOption,
  existingShifts: IndividualShift[]
): number {
  const shiftStart = new Date(`${date}T${shiftOption.start_time}`)
  const recentShifts = existingShifts
    .filter(shift => {
      if (!shift.actual_end_time) return false
      const shiftEnd = new Date(shift.actual_end_time)
      const hoursDiff = (shiftStart.getTime() - shiftEnd.getTime()) / (1000 * 60 * 60)
      return hoursDiff <= 24 // Only consider shifts in the last 24 hours
    })
    .sort((a, b) => {
      const aEnd = new Date(a.actual_end_time!).getTime()
      const bEnd = new Date(b.actual_end_time!).getTime()
      return bEnd - aEnd
    })

  if (recentShifts.length === 0) return 1

  const lastShift = recentShifts[0]
  if (!lastShift.actual_end_time) return 1

  const lastShiftEnd = new Date(lastShift.actual_end_time)
  const restHours = (shiftStart.getTime() - lastShiftEnd.getTime()) / (1000 * 60 * 60)

  if (restHours < MIN_REST_HOURS) return 0
  if (restHours >= OPTIMAL_REST_HOURS) return 1

  return (restHours - MIN_REST_HOURS) / (OPTIMAL_REST_HOURS - MIN_REST_HOURS)
}

function calculateShiftPatternComplianceScore(
  employee: Employee,
  shiftOption: ShiftOption,
  date: string,
  shifts: ShiftEvent[]
): number {
  const consecutiveShifts = getConsecutiveShifts(employee.id, date, shifts)
  
  if (consecutiveShifts.length >= MAX_CONSECUTIVE_DAYS) return 0

  switch (employee.shift_pattern) {
    case 'pattern_a':
      // Four consecutive 10-hour shifts
      if (shiftOption.duration_hours !== 10) return 0
      if (consecutiveShifts.length >= 4) return 0
      return 1
    case 'pattern_b':
      // Three consecutive 12-hour shifts plus one 4-hour shift
      if (consecutiveShifts.length >= 4) return 0
      if (consecutiveShifts.length === 3 && shiftOption.duration_hours !== 4) return 0
      if (consecutiveShifts.length < 3 && shiftOption.duration_hours !== 12) return 0
      return 1
    default:
      return 1
  }
}

function calculateHistoricalFairnessScore(
  employee: Employee,
  shifts: ShiftEvent[]
): number {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentShifts = shifts.filter(shift => shift.start >= thirtyDaysAgo)
  const employeeShiftCount = recentShifts.filter(shift => shift.employee_id === employee.id).length
  const averageShifts = recentShifts.length / shifts.length

  if (employeeShiftCount <= averageShifts) return 1
  return Math.max(0, 1 - ((employeeShiftCount - averageShifts) / averageShifts))
} 