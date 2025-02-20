import { format, parseISO, isWithinInterval } from 'date-fns'
import type {
  Employee,
  ShiftOption,
  TimeOffRequest,
  StaffingRequirement
} from '@/types/scheduling/schedule'
import type { Holiday } from '@/types/shift-patterns'

export function validateSchedulePeriod(startDate: Date, endDate: Date): boolean {
  return startDate <= endDate
}

export function getAvailableEmployees(
  employees: Employee[],
  date: Date,
  timeOffRequests: TimeOffRequest[]
): Employee[] {
  const dateStr = format(date, 'yyyy-MM-dd')
  
  return employees.filter(employee => {
    // Check if employee has approved time off for this date
    const hasTimeOff = timeOffRequests.some(request => 
      request.employeeId === employee.id &&
      request.status === 'approved' &&
      isWithinInterval(date, {
        start: parseISO(request.startDate),
        end: parseISO(request.endDate)
      })
    )
    
    return !hasTimeOff
  })
}

export function getApplicableRequirements(
  requirements: StaffingRequirement[],
  date: Date,
  isHoliday: boolean
): StaffingRequirement[] {
  // For now, return all requirements
  // TODO: Add holiday-specific requirements
  return requirements
}

export function getMatchingShiftOptions(
  options: ShiftOption[],
  requirement: StaffingRequirement
): ShiftOption[] {
  return options.filter(option => {
    const optionStart = parseTimeString(option.startTime)
    const optionEnd = parseTimeString(option.endTime)
    const reqStart = parseTimeString(requirement.timeBlockStart)
    const reqEnd = parseTimeString(requirement.timeBlockEnd)
    
    // Handle overnight shifts
    const optionDuration = (optionEnd < optionStart) 
      ? optionEnd + 1440 - optionStart 
      : optionEnd - optionStart
      
    return optionStart <= reqStart && (optionStart + optionDuration) >= reqEnd
  })
}

function parseTimeString(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
} 