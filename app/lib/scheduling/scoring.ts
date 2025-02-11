import { type ShiftEvent, type Employee, type ShiftOption } from '@/types'
import { type IndividualShift } from '@/types/scheduling'

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
  event: ShiftEvent,
  shifts: ShiftEvent[],
  employee: Employee,
  shiftOption: ShiftOption
): { score: number; factors: ScoreFactors } {
  // Calculate individual scores
  const preferredCategoryScore = calculatePreferredCategoryScore(employee, shiftOption)
  const timeSinceLastShiftScore = calculateTimeSinceLastShiftScore(employee, event.date, shifts)
  const weeklyHoursBalanceScore = calculateWeeklyHoursBalanceScore(employee, shiftOption, event.date, shifts)
  const restPeriodScore = calculateRestPeriodScore(
    event.date,
    shiftOption,
    shifts.map(shift => ({
      ...shift,
      actual_hours_worked: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })) as IndividualShift[]
  )
  const shiftPatternComplianceScore = calculateShiftPatternComplianceScore(employee, shiftOption, event.date, shifts)
  const historicalFairnessScore = calculateHistoricalFairnessScore(employee, shifts)

  // Apply weights
  const factors: ScoreFactors = {
    preferredCategoryScore,
    timeSinceLastShiftScore,
    weeklyHoursBalanceScore,
    restPeriodScore,
    shiftPatternComplianceScore,
    historicalFairnessScore
  }

  // Calculate total weighted score
  const totalScore = (
    preferredCategoryScore * DEFAULT_WEIGHTS.preferredCategory +
    timeSinceLastShiftScore * DEFAULT_WEIGHTS.timeSinceLastShift +
    weeklyHoursBalanceScore * DEFAULT_WEIGHTS.weeklyHoursBalance +
    restPeriodScore * DEFAULT_WEIGHTS.restPeriod +
    shiftPatternComplianceScore * DEFAULT_WEIGHTS.shiftPatternCompliance +
    historicalFairnessScore * DEFAULT_WEIGHTS.historicalFairness
  ) / 100 // Normalize to 0-1 range

  return {
    score: totalScore,
    factors
  }
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