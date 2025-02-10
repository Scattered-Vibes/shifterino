import { Employee, ShiftOption, IndividualShift } from '@/types/scheduling'

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

const MIN_REST_HOURS = 10
const OPTIMAL_REST_HOURS = 12
const MAX_CONSECUTIVE_DAYS = 6

export function calculateShiftScore(
  employee: Employee,
  shiftOption: ShiftOption,
  date: string,
  existingShifts: IndividualShift[],
  weights: ScoreWeights = DEFAULT_WEIGHTS
): ScoredEmployee {
  const factors: ScoreFactors = {
    preferredCategoryScore: calculatePreferredCategoryScore(employee, shiftOption),
    timeSinceLastShiftScore: calculateTimeSinceLastShiftScore(employee, date, existingShifts),
    weeklyHoursBalanceScore: calculateWeeklyHoursBalanceScore(employee, shiftOption, date, existingShifts),
    restPeriodScore: calculateRestPeriodScore(date, shiftOption, existingShifts),
    shiftPatternComplianceScore: calculateShiftPatternComplianceScore(employee, shiftOption, date, existingShifts),
    historicalFairnessScore: calculateHistoricalFairnessScore(employee, existingShifts)
  }

  const totalScore = Object.entries(factors).reduce((score, [key, value]) => {
    const weightKey = key.replace('Score', '') as keyof ScoreWeights
    return score + (value * weights[weightKey])
  }, 0)

  return {
    employee,
    shiftOption,
    score: totalScore,
    factors
  }
}

function calculatePreferredCategoryScore(employee: Employee, shiftOption: ShiftOption): number {
  return employee.preferred_shift_category === shiftOption.category ? 1 : 0
}

function calculateTimeSinceLastShiftScore(
  employee: Employee,
  date: string,
  existingShifts: IndividualShift[]
): number {
  const lastShift = existingShifts
    .filter(shift => shift.employee_id === employee.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

  if (!lastShift) return 1 // No previous shifts, highest score

  const hoursSinceLastShift = (new Date(date).getTime() - new Date(lastShift.date).getTime()) / (1000 * 60 * 60)

  if (hoursSinceLastShift < MIN_REST_HOURS) return 0
  if (hoursSinceLastShift >= OPTIMAL_REST_HOURS) return 1

  return (hoursSinceLastShift - MIN_REST_HOURS) / (OPTIMAL_REST_HOURS - MIN_REST_HOURS)
}

function calculateWeeklyHoursBalanceScore(
  employee: Employee,
  shiftOption: ShiftOption,
  date: string,
  existingShifts: IndividualShift[]
): number {
  const weekStart = new Date(date)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  
  const weeklyHours = existingShifts
    .filter(shift => 
      shift.employee_id === employee.id &&
      new Date(shift.date) >= weekStart &&
      new Date(shift.date) < new Date(date)
    )
    .reduce((total, shift) => {
      const duration = (new Date(shift.actual_end_time).getTime() - new Date(shift.actual_start_time).getTime()) / (1000 * 60 * 60)
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
      const shiftEnd = new Date(shift.actual_end_time)
      const hoursDiff = (shiftStart.getTime() - shiftEnd.getTime()) / (1000 * 60 * 60)
      return hoursDiff <= 24 // Only consider shifts in the last 24 hours
    })
    .sort((a, b) => new Date(b.actual_end_time).getTime() - new Date(a.actual_end_time).getTime())

  if (recentShifts.length === 0) return 1

  const lastShiftEnd = new Date(recentShifts[0].actual_end_time)
  const restHours = (shiftStart.getTime() - lastShiftEnd.getTime()) / (1000 * 60 * 60)

  if (restHours < MIN_REST_HOURS) return 0
  if (restHours >= OPTIMAL_REST_HOURS) return 1

  return (restHours - MIN_REST_HOURS) / (OPTIMAL_REST_HOURS - MIN_REST_HOURS)
}

function calculateShiftPatternComplianceScore(
  employee: Employee,
  shiftOption: ShiftOption,
  date: string,
  existingShifts: IndividualShift[]
): number {
  const consecutiveShifts = getConsecutiveShifts(employee.id, date, existingShifts)
  
  if (consecutiveShifts.length >= MAX_CONSECUTIVE_DAYS) return 0

  if (employee.shift_pattern === 'PATTERN_A') {
    // Four consecutive 10-hour shifts
    if (shiftOption.duration_hours !== 10) return 0
    if (consecutiveShifts.length >= 4) return 0
    return 1
  } else {
    // Three consecutive 12-hour shifts plus one 4-hour shift
    if (consecutiveShifts.length >= 4) return 0
    if (consecutiveShifts.length === 3 && shiftOption.duration_hours !== 4) return 0
    if (consecutiveShifts.length < 3 && shiftOption.duration_hours !== 12) return 0
    return 1
  }
}

function calculateHistoricalFairnessScore(
  employee: Employee,
  existingShifts: IndividualShift[]
): number {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentShifts = existingShifts.filter(shift => 
    new Date(shift.date) >= thirtyDaysAgo
  )

  const employeeShiftCount = recentShifts.filter(shift => 
    shift.employee_id === employee.id
  ).length

  const averageShifts = recentShifts.length / existingShifts.length

  if (employeeShiftCount <= averageShifts) return 1
  return Math.max(0, 1 - ((employeeShiftCount - averageShifts) / averageShifts))
}

function getConsecutiveShifts(
  employeeId: string,
  date: string,
  existingShifts: IndividualShift[]
): IndividualShift[] {
  const shifts = existingShifts
    .filter(shift => shift.employee_id === employeeId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const consecutive: IndividualShift[] = []
  let currentDate = new Date(date)

  for (const shift of shifts) {
    const shiftDate = new Date(shift.date)
    const dayDiff = (currentDate.getTime() - shiftDate.getTime()) / (1000 * 60 * 60 * 24)
    
    if (dayDiff === 1) {
      consecutive.push(shift)
      currentDate = shiftDate
    } else {
      break
    }
  }

  return consecutive
} 