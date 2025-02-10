import { createClient } from '@/lib/supabase/server'
import { IndividualShift, Employee, ShiftOption } from '@/types/scheduling'

export interface ShiftConflict {
  type: 'OVERLAP' | 'REST_PERIOD' | 'WEEKLY_HOURS' | 'PATTERN_VIOLATION'
  details: string
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
        type: 'OVERLAP',
        details: `Overlaps with existing shift(s): ${overlappingShifts.map(s => s.id).join(', ')}`
      })
    }

    // Check minimum rest period
    const restStart = new Date(params.startTime)
    restStart.setHours(restStart.getHours() - 10) // 10 hours minimum rest
    
    const { data: recentShifts, error: recentError } = await supabase
      .from('individual_shifts')
      .select('*')
      .eq('employee_id', params.employeeId)
      .gte('actual_end_time', restStart.toISOString())
      .lt('actual_end_time', params.startTime)

    if (recentError) {
      throw recentError
    }

    if (recentShifts && recentShifts.length > 0) {
      conflicts.push({
        type: 'REST_PERIOD',
        details: 'Insufficient rest period between shifts'
      })
    }

    // Check weekly hours
    const weekStart = new Date(params.startTime)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const { data: weekShifts, error: weekError } = await supabase
      .from('individual_shifts')
      .select('*, shift_options!inner(*)')
      .eq('employee_id', params.employeeId)
      .gte('date', weekStart.toISOString().split('T')[0])
      .lt('date', weekEnd.toISOString().split('T')[0])

    if (weekError) {
      throw weekError
    }

    if (weekShifts) {
      const totalHours = weekShifts.reduce((sum, shift) => {
        const duration = (new Date(shift.actual_end_time).getTime() - new Date(shift.actual_start_time).getTime()) / (1000 * 60 * 60)
        return sum + duration
      }, 0)

      // Get the employee's weekly hours cap
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('weekly_hours_cap, max_overtime_hours')
        .eq('id', params.employeeId)
        .single()

      if (employeeError) {
        throw employeeError
      }

      if (employee) {
        const { data: shiftOption, error: shiftOptionError } = await supabase
          .from('shift_options')
          .select('duration_hours')
          .eq('id', params.shiftOptionId)
          .single()

        if (shiftOptionError) {
          throw shiftOptionError
        }

        if (shiftOption) {
          const projectedHours = totalHours + shiftOption.duration_hours

          if (projectedHours > employee.weekly_hours_cap) {
            if (!employee.max_overtime_hours || projectedHours > employee.weekly_hours_cap + employee.max_overtime_hours) {
              conflicts.push({
                type: 'WEEKLY_HOURS',
                details: `Exceeds weekly hours cap (${employee.weekly_hours_cap} hours)`
              })
            }
          }
        }
      }
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
  employee: Employee,
  shiftOption: ShiftOption
): { canProceed: boolean; requiresOverride: boolean; message: string } {
  // Check if there are any hard conflicts that cannot be overridden
  const hasHardConflict = conflicts.some(
    conflict => conflict.type === 'OVERLAP' || conflict.type === 'REST_PERIOD'
  )

  if (hasHardConflict) {
    return {
      canProceed: false,
      requiresOverride: false,
      message: 'Cannot proceed due to hard conflicts (overlapping shifts or insufficient rest)'
    }
  }

  // Check for soft conflicts that can be overridden
  const hasSoftConflict = conflicts.some(
    conflict => conflict.type === 'WEEKLY_HOURS' || conflict.type === 'PATTERN_VIOLATION'
  )

  if (hasSoftConflict) {
    return {
      canProceed: true,
      requiresOverride: true,
      message: 'Can proceed with manager override (exceeds weekly hours or pattern violation)'
    }
  }

  return {
    canProceed: true,
    requiresOverride: false,
    message: 'No conflicts detected'
  }
} 