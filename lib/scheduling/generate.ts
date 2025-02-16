import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Employee,
  StaffingRequirement,
  IndividualShift,
  ShiftOption
} from '@/types/supabase/index'
import type {
  GenerationContext,
  ScheduleGenerationParams,
  ScheduleGenerationResult,
  ShiftPattern,
  Holiday
} from '@/types/scheduling/schedule'
import type { ShiftEvent, ShiftPatternType } from '@/types/scheduling/shift'
import { convertToShiftEvent } from '@/types/scheduling/shift'
import { createClient } from '@/lib/supabase/server'
import { requireManager } from '@/lib/auth/server'
import { handleError, AppError, ErrorCode } from '@/lib/utils/error-handler'
import { validateShiftPattern } from '@/lib/utils/shift-patterns'
import { checkTimeOffConflicts } from '@/lib/utils/time-off'
import { calculateShiftScore } from './scoring'
import { parseISO, addDays, format, isSameDay } from 'date-fns'
import { revalidatePath } from 'next/cache'

interface ScoredEmployee {
  employee: Employee
  shiftOption: ShiftOption
  score: number
}

interface RequirementGroup {
  requirement: StaffingRequirement
  shiftOptions: ShiftOption[]
  neededCount: number
  supervisorCount: number
}

export async function generateSchedule(
  periodId: string,
  params: ScheduleGenerationParams
): Promise<ScheduleGenerationResult> {
  try {
    // Verify manager role
    await requireManager()
    
    const supabase = await createClient()
    
    // Initialize context
    const context = await initializeContext(supabase, periodId, params)
    
    // Validate inputs
    if (!context.employees.length) {
      throw new AppError('No employees available for scheduling', ErrorCode.VALIDATION_ERROR)
    }
    if (!context.shiftOptions.length) {
      throw new AppError('No shift options defined', ErrorCode.VALIDATION_ERROR)
    }
    if (!context.staffingRequirements.length) {
      throw new AppError('No staffing requirements defined', ErrorCode.VALIDATION_ERROR)
    }

    const assignedShifts: IndividualShift[] = []
    const errors: string[] = []
    let currentDate = parseISO(context.startDate)
    const endDate = parseISO(context.endDate)

    // Process each day
    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      
      // Get requirements for this day
      const dayRequirements = context.staffingRequirements.filter(req =>
        isSameDay(parseISO(req.start_time), currentDate)
      )

      // Group requirements with matching shift options
      const requirementGroups = groupRequirements(dayRequirements, context.shiftOptions)

      // Process each requirement group
      for (const group of requirementGroups) {
        const assignedEmployees = new Set<string>()
        
        // First, assign supervisors if needed
        if (group.requirement.min_supervisors > 0) {
          const supervisorAssignments = await assignSupervisors(
            group,
            context,
            currentDate,
            assignedEmployees
          )
          assignedShifts.push(...supervisorAssignments)
          
          if (supervisorAssignments.length < group.requirement.min_supervisors) {
            errors.push(
              `Could not meet supervisor requirement for ${dateStr} ` +
              `(${group.requirement.start_time} - ${group.requirement.end_time})`
            )
          }
        }

        // Then assign remaining staff
        const remainingNeeded = group.requirement.min_total_staff - assignedEmployees.size
        if (remainingNeeded > 0) {
          const staffAssignments = await assignStaff(
            group,
            context,
            currentDate,
            assignedEmployees,
            remainingNeeded
          )
          assignedShifts.push(...staffAssignments)
          
          if (staffAssignments.length < remainingNeeded) {
            errors.push(
              `Could not meet staffing requirement for ${dateStr} ` +
              `(${group.requirement.start_time} - ${group.requirement.end_time})`
            )
          }
        }
      }

      currentDate = addDays(currentDate, 1)
    }

    // Save generated shifts
    const { error: insertError } = await supabase
      .from('individual_shifts')
      .insert(assignedShifts)

    if (insertError) {
      throw new AppError(
        'Failed to save generated shifts',
        ErrorCode.DATABASE,
        { details: insertError }
      )
    }

    revalidatePath('/schedule')
    
    return {
      success: errors.length === 0,
      shiftsGenerated: assignedShifts.length,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error) {
    throw handleError(error)
  }
}

function convertEmployeePatternType(pattern: string): ShiftPatternType {
  if (pattern !== '4x10' && pattern !== '3x12+4') {
    throw new AppError(
      `Invalid shift pattern: ${pattern}`,
      ErrorCode.VALIDATION_ERROR
    )
  }
  return pattern === '4x10' ? 'PATTERN_A' : 'PATTERN_B'
}

async function initializeContext(
  supabase: SupabaseClient,
  periodId: string,
  params: ScheduleGenerationParams
): Promise<GenerationContext> {
  // Fetch period dates
  const { data: period, error: periodError } = await supabase
    .from('schedule_periods')
    .select('start_date, end_date')
    .eq('id', periodId)
    .single()

  if (periodError || !period) {
    throw new AppError(
      'Schedule period not found',
      ErrorCode.NOT_FOUND,
      { details: periodError }
    )
  }

  // Fetch employees
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('*')
    .in('id', params.employeeIds)

  if (employeesError || !employees) {
    throw new AppError(
      'Failed to fetch employees',
      ErrorCode.DATABASE,
      { details: employeesError }
    )
  }

  // Fetch time off requests
  const { data: timeOffRequests, error: timeOffError } = await supabase
    .from('time_off_requests')
    .select('*')
    .in('employee_id', params.employeeIds)
    .eq('status', 'approved')
    .gte('end_date', period.start_date)
    .lte('start_date', period.end_date)

  if (timeOffError) {
    throw new AppError(
      'Failed to fetch time off requests',
      ErrorCode.DATABASE,
      { details: timeOffError }
    )
  }

  // Fetch existing shifts
  const { data: existingShifts, error: shiftsError } = await supabase
    .from('individual_shifts')
    .select('*')
    .in('employee_id', params.employeeIds)
    .gte('date', period.start_date)
    .lte('date', period.end_date)

  if (shiftsError) {
    throw new AppError(
      'Failed to fetch existing shifts',
      ErrorCode.DATABASE,
      { details: shiftsError }
    )
  }

  // Fetch staffing requirements
  const { data: requirements, error: requirementsError } = await supabase
    .from('staffing_requirements')
    .select('*')
    .gte('start_time', period.start_date)
    .lte('end_time', period.end_date)

  if (requirementsError || !requirements) {
    throw new AppError(
      'Failed to fetch staffing requirements',
      ErrorCode.DATABASE,
      { details: requirementsError }
    )
  }

  // Fetch shift options
  const { data: shiftOptions, error: optionsError } = await supabase
    .from('shift_options')
    .select('*')

  if (optionsError || !shiftOptions) {
    throw new AppError(
      'Failed to fetch shift options',
      ErrorCode.DATABASE,
      { details: optionsError }
    )
  }

  // Fetch holidays
  const { data: holidays, error: holidaysError } = await supabase
    .from('holidays')
    .select('*')
    .gte('date', period.start_date)
    .lte('date', period.end_date)

  if (holidaysError) {
    throw new AppError(
      'Failed to fetch holidays',
      ErrorCode.DATABASE,
      { details: holidaysError }
    )
  }

  // Initialize tracking data
  const weeklyHours: Record<string, Record<string, number>> = {}
  const shiftPatterns: Record<string, ShiftPattern> = {}

  for (const employee of employees) {
    weeklyHours[employee.id] = {}
    shiftPatterns[employee.id] = {
      consecutiveShifts: 0,
      lastShiftEnd: null,
      currentPattern: convertEmployeePatternType(employee.shift_pattern)
    }
  }

  return {
    periodId,
    startDate: period.start_date,
    endDate: period.end_date,
    employees,
    timeOffRequests: timeOffRequests || [],
    staffingRequirements: requirements,
    shiftOptions,
    params,
    weeklyHours,
    shiftPatterns,
    existingShifts: existingShifts || [],
    holidays: holidays || []
  }
}

function groupRequirements(
  requirements: StaffingRequirement[],
  shiftOptions: ShiftOption[]
): RequirementGroup[] {
  return requirements.map(requirement => {
    // Find shift options that cover this requirement
    const matchingOptions = shiftOptions.filter(option => {
      const optionStart = parseISO(`${requirement.start_time.split('T')[0]}T${option.start_time}:00.000Z`)
      const optionEnd = parseISO(`${requirement.start_time.split('T')[0]}T${option.end_time}:00.000Z`)
      const reqStart = parseISO(requirement.start_time)
      const reqEnd = parseISO(requirement.end_time)

      // Handle overnight shifts
      if (option.is_overnight && optionEnd < optionStart) {
        optionEnd.setDate(optionEnd.getDate() + 1)
      }

      return optionStart <= reqStart && optionEnd >= reqEnd
    })

    return {
      requirement,
      shiftOptions: matchingOptions,
      neededCount: requirement.min_total_staff,
      supervisorCount: requirement.min_supervisors
    }
  })
}

async function assignSupervisors(
  group: RequirementGroup,
  context: GenerationContext,
  date: Date,
  assignedEmployees: Set<string>
): Promise<IndividualShift[]> {
  const assignments: IndividualShift[] = []
  const supervisors = context.employees.filter(e => e.role === 'supervisor')
  
  for (let i = 0; i < group.requirement.min_supervisors; i++) {
    const bestAssignment = await findBestEmployee(
      supervisors,
      group.shiftOptions,
      date,
      context,
      assignedEmployees
    )

    if (bestAssignment) {
      assignments.push(bestAssignment)
      assignedEmployees.add(bestAssignment.employee_id)
      updateContext(context, bestAssignment)
    }
  }

  return assignments
}

async function assignStaff(
  group: RequirementGroup,
  context: GenerationContext,
  date: Date,
  assignedEmployees: Set<string>,
  count: number
): Promise<IndividualShift[]> {
  const assignments: IndividualShift[] = []
  const availableStaff = context.employees.filter(e => !assignedEmployees.has(e.id))
  
  for (let i = 0; i < count; i++) {
    const bestAssignment = await findBestEmployee(
      availableStaff,
      group.shiftOptions,
      date,
      context,
      assignedEmployees
    )

    if (bestAssignment) {
      assignments.push(bestAssignment)
      assignedEmployees.add(bestAssignment.employee_id)
      updateContext(context, bestAssignment)
    }
  }

  return assignments
}

async function findBestEmployee(
  employees: Employee[],
  shiftOptions: ShiftOption[],
  date: Date,
  context: GenerationContext,
  assignedEmployees: Set<string>
): Promise<IndividualShift | null> {
  let bestScore = -1
  let bestAssignment: IndividualShift | null = null
  const dateStr = format(date, 'yyyy-MM-dd')

  for (const employee of employees) {
    if (assignedEmployees.has(employee.id)) continue

    for (const option of shiftOptions) {
      const pattern: ShiftPatternType = employee.shift_pattern === '4x10' ? 'PATTERN_A' : 'PATTERN_B'
      
      const baseShift: IndividualShift = {
        id: '', // Will be assigned by database
        employee_id: employee.id,
        date: dateStr,
        assigned_shift_id: null,
        actual_hours_worked: null,
        status: 'scheduled',
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
        updated_by: null
      }

      const shift: ShiftEvent = {
        ...baseShift,
        start: `${dateStr}T${option.start_time}:00.000Z`,
        end: option.is_overnight
          ? `${format(addDays(date, 1), 'yyyy-MM-dd')}T${option.end_time}:00.000Z`
          : `${dateStr}T${option.end_time}:00.000Z`,
        pattern
      }

      // Check for conflicts
      const conflicts = checkTimeOffConflicts(shift, context.timeOffRequests)
      if (conflicts.length > 0) continue

      // Validate pattern
      if (!validateShiftPattern(shift, context.existingShifts)) continue

      // Calculate score
      const score = calculateShiftScore(employee, shift, context)
      if (score > bestScore) {
        bestScore = score
        bestAssignment = baseShift
      }
    }
  }

  return bestAssignment
}

function updateContext(
  context: GenerationContext,
  assignment: IndividualShift
): void {
  // Get the associated shift option
  const shiftOption = context.shiftOptions.find(
    option => option.id === assignment.assigned_shift_id
  )
  
  if (!shiftOption) {
    console.warn('No shift option found for assignment:', assignment)
    return
  }

  // Find the employee
  const employee = context.employees.find(e => e.id === assignment.employee_id)
  if (!employee) {
    console.warn('No employee found for assignment:', assignment)
    return
  }

  // Convert to ShiftEvent for calculations
  try {
    const shiftEvent = convertToShiftEvent(
      assignment,
      {
        start_time: shiftOption.start_time,
        end_time: shiftOption.end_time,
        pattern: convertEmployeePatternType(employee.shift_pattern)
      }
    )

    // Update weekly hours
    const weekStart = format(
      parseISO(assignment.date).setDate(
        parseISO(assignment.date).getDate() - parseISO(assignment.date).getDay()
      ),
      'yyyy-MM-dd'
    )
    
    if (!context.weeklyHours[assignment.employee_id]) {
      context.weeklyHours[assignment.employee_id] = {}
    }
    if (!context.weeklyHours[assignment.employee_id][weekStart]) {
      context.weeklyHours[assignment.employee_id][weekStart] = 0
    }

    const hours = (
      parseISO(shiftEvent.end).getTime() -
      parseISO(shiftEvent.start).getTime()
    ) / (1000 * 60 * 60)
    
    context.weeklyHours[assignment.employee_id][weekStart] += hours

    // Update shift patterns
    const pattern = context.shiftPatterns[assignment.employee_id]
    if (pattern) {
      if (pattern.lastShiftEnd === null) {
        pattern.consecutiveShifts = 1
      } else {
        const dayDiff = Math.round(
          (parseISO(shiftEvent.start).getTime() - pattern.lastShiftEnd.getTime()) /
          (1000 * 60 * 60 * 24)
        )
        if (dayDiff === 1) {
          pattern.consecutiveShifts++
        } else {
          pattern.consecutiveShifts = 1
        }
      }
      pattern.lastShiftEnd = parseISO(shiftEvent.end)
    }
  } catch (error) {
    console.error('Error updating context:', error)
    throw error instanceof AppError ? error : new AppError(
      'Failed to update scheduling context',
      ErrorCode.OPERATION_FAILED,
      { cause: error }
    )
  }
} 