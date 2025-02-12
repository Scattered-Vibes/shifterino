import { createClient } from '@/lib/supabase/client'
import type { 
  IndividualShift,
  ShiftOption,
  ShiftConflict
} from '@/types/models/shift'
import type { Employee } from '@/types/models/employee'
import type { ScheduleConflict } from '@/types/models/schedule'
import type { Schedule } from '@/types/scheduling/schedule'

export function validateShiftConflicts(
  shift: IndividualShift,
  existingShifts: IndividualShift[],
  _pattern: string // TODO: Implement pattern validation
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []

  // Check for overlapping shifts
  const overlaps = existingShifts.filter(existingShift => {
    const shiftStart = new Date(shift.actual_start_time || '')
    const shiftEnd = new Date(shift.actual_end_time || '')
    const existingStart = new Date(existingShift.actual_start_time || '')
    const existingEnd = new Date(existingShift.actual_end_time || '')

    // Skip invalid dates
    if (!shiftStart.getTime() || !shiftEnd.getTime() || !existingStart.getTime() || !existingEnd.getTime()) {
      return false
    }

    return (
      existingShift.employee_id === shift.employee_id &&
      ((shiftStart >= existingStart && shiftStart < existingEnd) ||
        (shiftEnd > existingStart && shiftEnd <= existingEnd) ||
        (shiftStart <= existingStart && shiftEnd >= existingEnd))
    )
  })

  if (overlaps.length > 0) {
    conflicts.push({
      type: 'overlap',
      message: 'Shift overlaps with existing shifts',
      shifts: overlaps.map(overlap => ({
        ...overlap,
        fatigue_level: 0,
        is_overtime: false,
        is_regular_schedule: true
      }))
    })
  }

  return conflicts
}

export interface ConflictCheckParams {
  employeeId: string
  startTime: string
  endTime: string
  shiftOptionId: string
  excludeShiftId?: string
}

export async function checkShiftConflicts(
  params: ConflictCheckParams
): Promise<{ conflicts: ShiftConflict[]; error: Error | null }> {
  try {
    const supabase = createClient()
    const conflicts: ShiftConflict[] = []

    // Check for overlapping shifts
    const { data: overlappingShifts, error: overlapError } = await supabase
      .from('individual_shifts')
      .select('*')
      .eq('employee_id', params.employeeId)
      .or(`actual_start_time.lte.${params.endTime},actual_end_time.gte.${params.startTime}`)

    if (overlapError) {
      throw overlapError
    }

    if (overlappingShifts && overlappingShifts.length > 0) {
      conflicts.push({
        type: 'overlap',
        message: `Overlaps with existing shift(s): ${overlappingShifts.map((s: IndividualShift) => s.id).join(', ')}`
      })
    }

    return { conflicts, error: null }
  } catch (error) {
    return {
      conflicts: [],
      error: error instanceof Error ? error : new Error('Unknown error occurred')
    }
  }
}

interface Conflict {
  type: 'overlap' | 'insufficient_rest' | 'overtime'
  employeeId: string
  shifts: string[]
  description: string
}

interface Resolution {
  action: 'reassign' | 'remove' | 'adjust'
  shiftId: string
  newEmployeeId?: string
  adjustedTime?: string
}

interface ConflictResolution {
  conflicts: Conflict[]
  resolutions: Resolution[]
}

export async function resolveConflicts(schedule: Schedule[]): Promise<ConflictResolution> {
  const conflicts: Conflict[] = []
  const resolutions: Resolution[] = []

  // Group shifts by employee
  const employeeShifts = schedule.reduce((acc, shift) => {
    if (!acc[shift.employeeId]) {
      acc[shift.employeeId] = []
    }
    acc[shift.employeeId].push(shift)
    return acc
  }, {} as Record<string, Schedule[]>)

  // Check for conflicts
  for (const [employeeId, shifts] of Object.entries(employeeShifts)) {
    // Check for overlapping shifts
    const overlaps = findOverlappingShifts(shifts)
    if (overlaps.length > 0) {
      conflicts.push({
        type: 'overlap',
        employeeId,
        shifts: overlaps.map(s => s.id),
        description: `Employee ${employeeId} has overlapping shifts`
      })

      // Resolve overlap by reassigning one shift
      resolutions.push({
        action: 'reassign',
        shiftId: overlaps[0].id
      })
    }

    // Check for insufficient rest
    const insufficientRest = findInsufficientRest(shifts)
    if (insufficientRest.length > 0) {
      conflicts.push({
        type: 'insufficient_rest',
        employeeId,
        shifts: insufficientRest.map(s => s.id),
        description: `Employee ${employeeId} has insufficient rest between shifts`
      })

      // Resolve by adjusting shift time
      resolutions.push({
        action: 'adjust',
        shiftId: insufficientRest[1].id,
        adjustedTime: calculateAdjustedTime(insufficientRest[0], insufficientRest[1])
      })
    }

    // Check for overtime
    const weeklyHours = calculateWeeklyHours(shifts)
    if (weeklyHours > 40) {
      const overtimeShifts = findOvertimeShifts(shifts)
      conflicts.push({
        type: 'overtime',
        employeeId,
        shifts: overtimeShifts.map(s => s.id),
        description: `Employee ${employeeId} exceeds 40 hours per week`
      })

      // Resolve by reassigning overtime shifts
      resolutions.push({
        action: 'reassign',
        shiftId: overtimeShifts[0].id
      })
    }
  }

  return { conflicts, resolutions }
}

function findOverlappingShifts(shifts: Schedule[]): Schedule[] {
  // Find shifts that overlap in time
  // This is a placeholder implementation
  return []
}

function findInsufficientRest(shifts: Schedule[]): Schedule[] {
  // Find shifts with less than 8 hours between them
  // This is a placeholder implementation
  return []
}

function calculateWeeklyHours(shifts: Schedule[]): number {
  // Calculate total hours for the week
  // This is a placeholder implementation
  return 0
}

function findOvertimeShifts(shifts: Schedule[]): Schedule[] {
  // Find shifts that cause overtime
  // This is a placeholder implementation
  return []
}

function calculateAdjustedTime(shift1: Schedule, shift2: Schedule): string {
  // Calculate adjusted time to ensure sufficient rest
  // This is a placeholder implementation
  return new Date().toISOString()
} 