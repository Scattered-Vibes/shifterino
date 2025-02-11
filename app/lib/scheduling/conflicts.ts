import { createClient } from '@/lib/supabase/client'
import type { 
  IndividualShift,
  ShiftOption,
  ShiftConflict
} from '@/app/types/models/shift'
import type { Employee } from '@/app/types/models/employee'
import type { ScheduleConflict } from '@/app/types/models/schedule'

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

export function resolveConflicts(
  conflicts: ShiftConflict[],
  _employee: Employee, // TODO: Implement employee-specific conflict resolution
  _shiftOption: ShiftOption // TODO: Implement shift option validation
): { canProceed: boolean; requiresOverride: boolean; message: string } {
  // Check if there are any hard conflicts that cannot be overridden
  const hasHardConflict = conflicts.some(
    conflict => conflict.type === 'overlap'
  )

  if (hasHardConflict) {
    return {
      canProceed: false,
      requiresOverride: false,
      message: 'Cannot proceed due to hard conflicts (overlapping shifts)'
    }
  }

  return {
    canProceed: true,
    requiresOverride: false,
    message: 'No hard conflicts found'
  }
} 