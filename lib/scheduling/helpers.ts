import { Employee, TimeOffRequest, StaffingRequirement, ShiftOption } from '@/types/scheduling'

export function isEmployeeAvailable(
  employeeId: string,
  date: string,
  timeOffRequests: TimeOffRequest[]
): boolean {
  return !timeOffRequests.some(
    (req) =>
      req.employee_id === employeeId &&
      req.status === 'APPROVED' &&
      new Date(date) >= new Date(req.start_date) &&
      new Date(date) <= new Date(req.end_date)
  )
}

export function getApplicableRequirements(
  date: string,
  staffingRequirements: StaffingRequirement[],
  isHoliday: boolean
): StaffingRequirement[] {
  return staffingRequirements.filter((req) => req.is_holiday === isHoliday)
}

export function getMatchingShiftOptions(
  requirement: StaffingRequirement,
  shiftOptions: ShiftOption[]
): ShiftOption[] {
  return shiftOptions.filter(
    (option) =>
      option.start_time === requirement.start_time &&
      option.end_time === requirement.end_time
  )
}

export function validateSchedulePeriod(startDate: string, endDate: string): boolean {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Ensure dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false
  }
  
  // Ensure end date is after start date
  if (end <= start) {
    return false
  }
  
  // Ensure schedule period is not more than 6 months
  const sixMonthsInMs = 180 * 24 * 60 * 60 * 1000
  if (end.getTime() - start.getTime() > sixMonthsInMs) {
    return false
  }
  
  return true
}

export function getAvailableEmployees(
  employees: Employee[],
  date: string,
  timeOffRequests: TimeOffRequest[]
): Employee[] {
  return employees.filter((employee) =>
    isEmployeeAvailable(employee.id, date, timeOffRequests)
  )
} 