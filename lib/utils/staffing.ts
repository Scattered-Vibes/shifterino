import { ShiftEvent, StaffingRequirement, StaffingLevel } from '@/types/shift'

const MINUTES_IN_DAY = 24 * 60

function parseTimeString(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function formatTimeRange(start: string, end: string): string {
  return `${start}-${end}`
}

function isShiftInTimeRange(
  shift: ShiftEvent,
  timeStart: string,
  timeEnd: string
): boolean {
  const shiftStart = new Date(shift.start)
  const shiftEnd = new Date(shift.end)
  
  const periodStart = parseTimeString(timeStart)
  const periodEnd = parseTimeString(timeEnd)
  
  const shiftStartMinutes = shiftStart.getHours() * 60 + shiftStart.getMinutes()
  const shiftEndMinutes = shiftEnd.getHours() * 60 + shiftEnd.getMinutes()

  // Handle shifts that cross midnight
  if (periodStart < periodEnd) {
    // Normal case (e.g., 09:00-17:00)
    return (
      shiftStartMinutes < periodEnd &&
      shiftEndMinutes > periodStart
    )
  } else {
    // Overnight case (e.g., 21:00-05:00)
    return (
      shiftStartMinutes < periodEnd ||
      shiftEndMinutes > periodStart
    )
  }
}

export function calculateStaffingLevels(
  shifts: ShiftEvent[],
  requirements: StaffingRequirement[]
): StaffingLevel[] {
  return requirements.map(requirement => {
    const shiftsInRange = shifts.filter(shift =>
      isShiftInTimeRange(shift, requirement.timeStart, requirement.timeEnd)
    )

    const currentStaff = shiftsInRange.length
    const hasSupervisor = shiftsInRange.some(
      shift => shift.employeeRole === 'supervisor'
    )

    const isMet = 
      currentStaff >= requirement.minStaff &&
      (!requirement.supervisorRequired || hasSupervisor)

    return {
      timeRange: formatTimeRange(requirement.timeStart, requirement.timeEnd),
      currentStaff,
      requiredStaff: requirement.minStaff,
      hasSupervisor,
      supervisorRequired: requirement.supervisorRequired,
      isMet
    }
  })
}

export function validateStaffingRequirements(
  shifts: ShiftEvent[],
  requirements: StaffingRequirement[]
): boolean {
  const staffingLevels = calculateStaffingLevels(shifts, requirements)
  return staffingLevels.every(level => level.isMet)
}

export function findUnderstaffedPeriods(
  shifts: ShiftEvent[],
  requirements: StaffingRequirement[]
): StaffingLevel[] {
  const staffingLevels = calculateStaffingLevels(shifts, requirements)
  return staffingLevels.filter(level => !level.isMet)
}

export function suggestShiftAdjustments(
  shifts: ShiftEvent[],
  requirements: StaffingRequirement[]
): { 
  understaffedPeriods: StaffingLevel[],
  overstaffedPeriods: StaffingLevel[],
  suggestions: string[]
} {
  const staffingLevels = calculateStaffingLevels(shifts, requirements)
  const understaffedPeriods = staffingLevels.filter(level => !level.isMet)
  const overstaffedPeriods = staffingLevels.filter(level => 
    level.currentStaff > level.requiredStaff + 1 // +1 buffer
  )

  const suggestions: string[] = []

  understaffedPeriods.forEach(period => {
    const shortfall = period.requiredStaff - period.currentStaff
    suggestions.push(
      `Need ${shortfall} more staff during ${period.timeRange}` +
      (period.supervisorRequired && !period.hasSupervisor 
        ? ' (including at least one supervisor)'
        : ''
      )
    )
  })

  overstaffedPeriods.forEach(period => {
    const excess = period.currentStaff - period.requiredStaff
    suggestions.push(
      `Consider reducing staff by ${excess} during ${period.timeRange}`
    )
  })

  return {
    understaffedPeriods,
    overstaffedPeriods,
    suggestions
  }
} 