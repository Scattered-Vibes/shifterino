/**
 * Schedule generation module for 911 dispatch center staffing.
 * Handles complex scheduling requirements including shift patterns,
 * staffing minimums, supervisor coverage, and holiday handling.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type {
  Employee,
  ShiftOption,
  TimeOffRequest,
  StaffingRequirement,
  IndividualShift,
  ScheduleGenerationParams,
  ScheduleGenerationResult,
  GenerationContext
} from '@/types/scheduling/schedule'
import {
  getAvailableEmployees,
  getApplicableRequirements,
  getMatchingShiftOptions,
  validateSchedulePeriod,
} from './helpers'
import { calculateShiftScore } from './scoring'
import {
  initializeTracking,
  updateWeeklyHours,
  updateShiftPattern,
  canAssignShift,
} from './tracking'
import { format, startOfDay, isEqual } from 'date-fns'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'

interface ScoredEmployee {
  employee: Employee
  shiftOption: ShiftOption
  score: number
}

/**
 * Initialize the generation context with all required data.
 */
async function initializeContext(
  supabase: SupabaseClient,
  periodId: string,
  params: ScheduleGenerationParams
): Promise<GenerationContext> {
  // Fetch all required data in parallel for better performance
  const [
    { data: employees },
    { data: timeOffRequests },
    { data: staffingRequirements },
    { data: shiftOptions },
    { data: holidays },
  ] = await Promise.all([
    supabase.from('employees').select('*'),
    supabase.from('time_off_requests').select('*'),
    supabase.from('staffing_requirements').select('*'),
    supabase.from('shift_options').select('*'),
    supabase.from('holidays').select('*'),
  ])

  if (!employees || !timeOffRequests || !staffingRequirements || !shiftOptions || !holidays) {
    throw new AppError('Failed to fetch required data', ErrorCode.DATABASE)
  }

  const tracking = initializeTracking(employees)

  return {
    periodId,
    startDate: params.startDate,
    endDate: params.endDate,
    employees,
    timeOffRequests,
    staffingRequirements,
    shiftOptions,
    params,
    weeklyHours: tracking.weeklyHours,
    shiftPatterns: tracking.shiftPatterns,
    holidays: holidays.map(h => ({
      date: h.date,
      name: h.name,
      isObserved: h.is_observed
    }))
  }
}

/**
 * Check if a given date is a holiday.
 * Compares the date against the list of holidays in the context.
 */
function isHolidayDate(date: Date, holidays: { date: string; name: string; is_observed: boolean }[]): boolean {
  const dayStart = startOfDay(date)
  return holidays.some(holiday => isEqual(startOfDay(new Date(holiday.date)), dayStart))
}

/**
 * Get available employees for a specific shift.
 * Filters employees based on availability, shift patterns, and weekly hours.
 */
async function getAvailableEmployeesForShift(
  context: GenerationContext,
  date: string,
  shiftOption: ShiftOption
): Promise<Employee[]> {
  const availableEmployees = getAvailableEmployees(
    context.employees,
    date,
    context.timeOffRequests
  )

  return availableEmployees.filter(employee =>
    canAssignShift(employee, date, shiftOption, context.weeklyHours, context.shiftPatterns)
  )
}

/**
 * Score employees for a specific shift.
 * Returns a sorted list of employees with their scores for the given shift.
 */
function scoreEmployeesForShift(
  context: GenerationContext,
  date: string,
  shiftOption: ShiftOption,
  employees: Employee[]
): ScoredEmployee[] {
  return employees.map((employee) => {
    const shiftEvent = {
      id: employee.id,
      title: `${employee.first_name} ${employee.last_name}`,
      start: new Date(`${date}T${shiftOption.start_time}`),
      end: new Date(`${date}T${shiftOption.end_time}`),
      employee_id: employee.id,
      is_supervisor: employee.role === 'supervisor',
      status: 'scheduled' as const,
      actual_start_time: null,
      actual_end_time: null,
      notes: null,
      extendedProps: {
        employeeId: employee.id,
        category: shiftOption.category,
        status: 'scheduled' as const
      }
    }

    // Get existing shifts for this employee
    const employeeShifts = context.existingShifts
      .filter(shift => shift.employee_id === employee.id)
      .map(shift => ({
        id: shift.id,
        title: `${employee.first_name} ${employee.last_name}`,
        start: new Date(`${shift.date}T${shiftOption.start_time}`),
        end: new Date(`${shift.date}T${shiftOption.end_time}`),
        employee_id: shift.employee_id,
        is_supervisor: employee.role === 'supervisor',
        status: shift.status,
        actual_start_time: shift.actual_start_time,
        actual_end_time: shift.actual_end_time,
        notes: shift.notes,
        extendedProps: {
          employeeId: shift.employee_id,
          category: shiftOption.category,
          status: shift.status
        }
      }))

    return {
      employee,
      shiftOption,
      ...calculateShiftScore(shiftEvent, employeeShifts, employee, shiftOption)
    }
  })
}

/**
 * Handle unfilled staffing requirement.
 * Creates an alert for staffing requirements that couldn't be met.
 */
async function handleUnfilledRequirement(
  context: GenerationContext,
  date: string,
  requirement: StaffingRequirement
): Promise<void> {
  const { supabase } = context

  const { error } = await supabase
    .from('staffing_alerts')
    .insert({
      date,
      requirement_id: requirement.id,
      alert_type: 'UNFILLED_REQUIREMENT',
      status: 'OPEN',
      details: `Unfilled staffing requirement for ${requirement.time_block_start} - ${requirement.time_block_end} on ${date}. Required: ${requirement.min_total_staff}, Supervisors: ${requirement.min_supervisors}`
    })

  if (error) {
    console.error("Failed to insert staffing alert:", error)
  }
}

/**
 * Batch assign shifts within a transaction.
 * Handles multiple shift assignments atomically and updates tracking information.
 */
async function batchAssignShifts(
  context: GenerationContext,
  shifts: IndividualShift[]
): Promise<{ error?: Error }> {
  const { supabase, periodId } = context

  try {
    // Start a transaction
    const { error: txError } = await supabase.rpc('begin_transaction')
    if (txError) throw txError

    try {
      // Batch insert shifts
      const { error: insertError } = await supabase
        .from('individual_shifts')
        .insert(
          shifts.map((shift) => ({
            employee_id: shift.employeeId,
            shift_option_id: shift.shiftOptionId,
            schedule_period_id: periodId,
            date: shift.date,
            status: 'scheduled'
          }))
        )

      if (insertError) throw insertError

      // Update tracking info in memory
      for (const shift of shifts) {
        const shiftOption = context.shiftOptions.find(opt => opt.id === shift.shiftOptionId)
        if (!shiftOption) {
          throw new Error(`Failed to find shift option for id: ${shift.shiftOptionId}`)
        }

        context.weeklyHours = updateWeeklyHours(
          context.weeklyHours,
          shift.employeeId,
          shift.date,
          shiftOption.duration_hours
        )
        context.shiftPatterns = updateShiftPattern(
          context.shiftPatterns,
          shift.employeeId,
          shift.date
        )
      }

      // Commit transaction
      const { error: commitError } = await supabase.rpc('commit_transaction')
      if (commitError) throw commitError

      return {}
    } catch (error) {
      // Rollback on error
      await supabase.rpc('rollback_transaction')
      throw error
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error("Failed to assign shifts")
    }
  }
}

/**
 * Generate schedule for the specified period.
 * Main entry point for schedule generation. Handles the entire process of
 * creating a schedule that meets all staffing requirements while respecting
 * constraints like shift patterns, weekly hours, and supervisor coverage.
 */
export async function generateSchedule(
  supabase: SupabaseClient,
  periodId: string,
  params: ScheduleGenerationParams
): Promise<ScheduleGenerationResult> {
  try {
    // 1. Validate the schedule period
    if (!validateSchedulePeriod(params.startDate, params.endDate)) {
      throw new AppError('Invalid schedule period', ErrorCode.INVALID_SCHEDULE_PERIOD)
    }

    // 2. Initialize generation context
    const context = await initializeContext(supabase, periodId, params)
    
    // 3. Validate required data
    if (!context.employees?.length) {
      throw new AppError('No employees found', ErrorCode.NO_EMPLOYEES_FOUND)
    }
    if (!context.shiftOptions?.length) {
      throw new AppError('No shift options found', ErrorCode.NO_SHIFT_OPTIONS)
    }
    if (!context.staffingRequirements?.length) {
      throw new AppError('No staffing requirements found', ErrorCode.NO_STAFFING_REQUIREMENTS)
    }

    let assignedShifts: IndividualShift[] = []
    let unfilledRequirements = 0
    const errors: string[] = []

    // 4. Generate schedule for each day in the period
    const startDate = new Date(params.startDate)
    const endDate = new Date(params.endDate)

    for (let currentDate = startDate; currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
      const dateString = format(currentDate, 'yyyy-MM-dd')
      const isHoliday = context.holidays.some(holiday => 
        isEqual(startOfDay(new Date(holiday.date)), startOfDay(currentDate))
      )

      // 5. Get applicable requirements for the current day
      const applicableRequirements = getApplicableRequirements(
        context.staffingRequirements,
        currentDate
      )

      // 6. Process each requirement
      for (const requirement of applicableRequirements) {
        const matchingShiftOptions = getMatchingShiftOptions(
          context.shiftOptions,
          requirement
        )

        if (matchingShiftOptions.length === 0) {
          errors.push(`No matching shift options for requirement on ${dateString}`)
          continue
        }

        // 7. Get and score available employees
        const availableEmployees = getAvailableEmployees(
          context.employees,
          currentDate,
          context.timeOffRequests
        )

        if (availableEmployees.length === 0) {
          errors.push(`No available employees for ${dateString}`)
          continue
        }

        // 8. Score and sort employees
        const scoredEmployees = availableEmployees.map(employee => ({
          employee,
          shiftOption: matchingShiftOptions[0],
          score: calculateShiftScore(employee, matchingShiftOptions[0], currentDate, context)
        })).sort((a, b) => b.score - a.score)

        // 9. Assign shifts
        let assignedCount = 0
        for (const { employee, shiftOption, score } of scoredEmployees) {
          if (assignedCount >= requirement.minTotalStaff) break

          if (canAssignShift(employee, shiftOption, currentDate, context)) {
            const newShift: IndividualShift = {
              employeeId: employee.id,
              shiftOptionId: shiftOption.id,
              schedulePeriodId: periodId,
              date: dateString,
              status: 'scheduled',
              isOvertime: false,
              isRegularSchedule: true,
              shiftScore: score,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }

            assignedShifts.push(newShift)
            assignedCount++

            // Update tracking
            updateWeeklyHours(employee, shiftOption, currentDate)
            updateShiftPattern(employee, shiftOption, currentDate)
          }
        }

        if (assignedCount < requirement.minTotalStaff) {
          unfilledRequirements++
          await handleUnfilledRequirement(context, dateString, requirement)
        }
      }
    }

    // 10. Save the generated schedule
    const { error: saveError } = await batchAssignShifts(context, assignedShifts)
    if (saveError) {
      throw new AppError('Failed to save schedule', ErrorCode.DATABASE, {
        originalError: saveError
      })
    }

    return {
      success: errors.length === 0,
      shiftsGenerated: assignedShifts.length,
      errors: errors.length > 0 ? errors : undefined,
      warnings: unfilledRequirements > 0 ? 
        [`${unfilledRequirements} staffing requirements could not be filled`] : 
        undefined
    }

  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    throw new AppError(
      'Failed to generate schedule',
      ErrorCode.UNKNOWN,
      { originalError: error }
    )
  }
}

async function generateDailySchedule(
  context: GenerationContext,
  date: Date
): Promise<ShiftAssignment[]> {
  const assignments: ShiftAssignment[] = []
  const requirements = getApplicableRequirements(context.staffingRequirements, date)
  
  // Process each time block's requirements
  for (const requirement of requirements) {
    const shiftOptions = getMatchingShiftOptions(context.shiftOptions, requirement)
    const availableEmployees = getAvailableEmployees(context.employees, date, context.timeOffRequests)
    
    // Assign shifts to meet requirements
    for (const shift of shiftOptions) {
      const neededEmployees = calculateNeededEmployees(requirement, assignments)
      
      for (let i = 0; i < neededEmployees; i++) {
        const bestEmployee = findBestEmployee(
          availableEmployees,
          shift,
          date,
          context
        )
        
        if (bestEmployee) {
          assignments.push({
            employeeId: bestEmployee.id,
            shiftOptionId: shift.id,
            date,
            isOvertime: false, // This will be calculated based on weekly hours
            score: calculateShiftScore(bestEmployee, shift, date, context)
          })
        }
      }
    }
  }

  return assignments
}

async function saveSchedule(
  supabase: SupabaseClient,
  periodId: string,
  assignments: ShiftAssignment[]
): Promise<{ success: boolean; warnings?: string[] }> {
  const warnings: string[] = []
  
  // Insert all assignments as individual shifts
  const { data, error } = await supabase
    .from('individual_shifts')
    .insert(
      assignments.map(assignment => ({
        employee_id: assignment.employeeId,
        shift_option_id: assignment.shiftOptionId,
        schedule_period_id: periodId,
        date: format(assignment.date, 'yyyy-MM-dd'),
        is_overtime: assignment.isOvertime,
        shift_score: assignment.score,
        is_regular_schedule: true
      }))
    )

  if (error) {
    throw error
  }

  return { success: true, warnings }
}

// Helper function to calculate how many more employees are needed
function calculateNeededEmployees(
  requirement: StaffingRequirement,
  currentAssignments: ShiftAssignment[]
): number {
  const assignedCount = currentAssignments.length
  return Math.max(0, requirement.minTotalStaff - assignedCount)
}

// Helper function to find the best employee for a shift
function findBestEmployee(
  availableEmployees: Employee[],
  shift: ShiftOption,
  date: Date,
  context: GenerationContext
): Employee | null {
  let bestScore = -1
  let bestEmployee: Employee | null = null

  for (const employee of availableEmployees) {
    if (!canAssignShift(employee, shift, date, context)) {
      continue
    }

    const score = calculateShiftScore(employee, shift, date, context)
    if (score > bestScore) {
      bestScore = score
      bestEmployee = employee
    }
  }

  return bestEmployee
} 