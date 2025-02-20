import type { 
  Employee,
  ShiftOption,
  TimeOffRequest,
  StaffingRequirement
} from '@/types/models/shift'
import { isWithinInterval, parseISO, startOfDay, getDay, format, addDays } from 'date-fns'

/**
 * Validate if a schedule period is valid.
 * Checks if the dates are valid and within allowed range.
 */
export function validateSchedulePeriod(startDate: Date, endDate: Date): boolean {
  if (!startDate || !endDate) return false
  if (endDate < startDate) return false
  
  // Maximum schedule period is 180 days = roughly 6 months
  const maxPeriod = 180 * 24 * 60 * 60 * 1000
  if (endDate.getTime() - startDate.getTime() > maxPeriod) return false
  
  return true
}

/**
 * Get staffing requirements applicable for a specific date.
 * Filters requirements based on date range and day of week.
 */
export function getApplicableRequirements(
  requirements: StaffingRequirement[],
  date: Date,
  isHoliday?: boolean
): StaffingRequirement[] {
  const dayOfWeek = date.getDay() // 0 (Sunday) to 6 (Saturday)

  return requirements.filter(req => {
    // Check if the requirement is for a holiday and if today is a holiday
    if (req.is_holiday !== null && req.is_holiday !== isHoliday) {
      return false // Skip if holiday status doesn't match
    }

    // If requirement has specific date range, check if date falls within it
    if (req.start_date && req.end_date) {
      return isWithinInterval(date, {
        start: parseISO(req.start_date),
        end: parseISO(req.end_date)
      })
    }

    // If requirement has specific day of week, check if it matches
    if (req.day_of_week !== null && req.day_of_week !== undefined) {
      return req.day_of_week === dayOfWeek
    }

    return true // If no specific constraints, requirement applies to all days
  })
}

/**
 * Get shift options that match a staffing requirement's time block.
 */
export function getMatchingShiftOptions(
  options: ShiftOption[],
  requirement: StaffingRequirement
): ShiftOption[] {
  return options.filter(option => {
    const optionStart = parseTimeString(option.start_time)
    let optionEnd = parseTimeString(option.end_time)
    const reqStart = parseTimeString(requirement.time_block_start)
    let reqEnd = parseTimeString(requirement.time_block_end)

    // Handle overnight shifts
    if (optionEnd < optionStart) {
      optionEnd += 24 * 60 // Add 24 hours if end time is earlier than start time
    }
    if (reqEnd <= reqStart) { // `<=` accounts for shifts ending exactly at midnight
      reqEnd += 24 * 60
    }
    
    // Check if option covers the requirement
    return optionStart <= reqStart && optionEnd >= reqEnd
  })
}

/**
 * Get available employees for a given date.
 * Filters out employees with time off or other conflicts.
 */
export function getAvailableEmployees(
  employees: Employee[],
  date: Date,
  timeOffRequests: TimeOffRequest[]
): Employee[] {
  const dayStart = startOfDay(date)

  return employees.filter(employee => {
    // Check for time off conflicts
    const hasTimeOff = timeOffRequests.some(request =>
      request.employee_id === employee.id &&
      request.status === 'approved' &&
      isWithinInterval(dayStart, {
        start: parseISO(request.start_date),
        end: parseISO(request.end_date)
      })
    )

    if (hasTimeOff) return false

    return true // Employee is available
  })
}

/**
 * Helper function to parse time string (HH:mm) to minutes since midnight
 */
export function parseTimeString(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Check if two time ranges overlap
 */
export function doTimeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = parseTimeString(start1)
  let e1 = parseTimeString(end1)
  const s2 = parseTimeString(start2)
  let e2 = parseTimeString(end2)

  // Handle shifts that cross midnight
  if (e1 < s1) e1 += 24 * 60
  if (e2 < s2) e2 += 24 * 60

  return s1 < e2 && s2 < e1
}

/**
 * Calculate the duration of a shift in hours
 */
export function calculateShiftDuration(startTime: string, endTime: string): number {
  const start = parseTimeString(startTime)
  let end = parseTimeString(endTime)

  // Handle shifts that cross midnight
  if (end < start) {
    end += 24 * 60
  }

  return (end - start) / 60
}

/**
 * Check if a shift crosses midnight
 */
export function doesShiftCrossMidnight(startTime: string, endTime: string): boolean {
  const start = parseTimeString(startTime)
  const end = parseTimeString(endTime)
  return end < start
}

/**
 * Format a minutes since midnight value back to HH:mm
 */
export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}