import { type ShiftEvent, type StaffingLevel, type Employee } from '@/types'

export function calculateStaffingLevel(
  shiftsInPeriod: ShiftEvent[],
  employees: Employee[]
): StaffingLevel {
  const total = shiftsInPeriod.length
  
  const supervisors = shiftsInPeriod.filter(shift => {
    const employee = employees.find(e => e.id === shift.employee_id)
    return employee?.role === 'supervisor'
  }).length
  
  return {
    total,
    supervisors,
    hasSupervisor: supervisors > 0,
    isSufficient: total >= 6 && supervisors >= 1 // Minimum staffing requirements
  }
}

export function validateStaffingLevel(
  shiftsInPeriod: ShiftEvent[],
  employees: Employee[],
  requiredTotal: number,
  requiredSupervisors: number
): { isValid: boolean; message?: string } {
  const staffing = calculateStaffingLevel(shiftsInPeriod, employees)
  
  if (staffing.total < requiredTotal) {
    return {
      isValid: false,
      message: `Insufficient total staff (${staffing.total}/${requiredTotal} required)`
    }
  }
  
  if (staffing.supervisors < requiredSupervisors) {
    return {
      isValid: false,
      message: `Insufficient supervisors (${staffing.supervisors}/${requiredSupervisors} required)`
    }
  }
  
  return { isValid: true }
}

export function getShiftsInPeriod(
  shifts: ShiftEvent[],
  start: Date,
  end: Date
): ShiftEvent[] {
  return shifts.filter(shift => {
    const shiftStart = new Date(shift.start)
    const shiftEnd = new Date(shift.end)
    return shiftStart >= start && shiftEnd <= end
  })
} 