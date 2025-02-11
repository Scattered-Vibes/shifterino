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
  ScheduleGenerationResult
} from '@/app/types'
import {
  getAvailableEmployees,
  getApplicableRequirements,
  getMatchingShiftOptions,
  validateSchedulePeriod,
} from './helpers'
import { calculateShiftScore, type ScoredEmployee } from './scoring'
import {
  initializeTracking,
  updateWeeklyHours,
  updateShiftPattern,
  canAssignShift,
} from './tracking'
import { format, addDays, isBefore, startOfDay, isEqual } from 'date-fns'

interface GenerationContext {
  supabase: SupabaseClient
  periodId: string
  start_date: string
  end_date: string
  employees: Employee[]
  timeOffRequests: TimeOffRequest[]
  staffingRequirements: StaffingRequirement[]
  shiftOptions: ShiftOption[]
  existingShifts: IndividualShift[]
  weeklyHours: Record<string, Record<string, number>>
  shiftPatterns: Record<string, {
    consecutive_shifts: number
    last_shift_end: Date | null
  }>
  holidays: {
    date: string
    name: string
    is_observed: boolean
  }[]
}

/**
 * Initialize the generation context with all required data.
 * Fetches employees, time off requests, staffing requirements, shift options,
 * existing shifts, and holidays in parallel for better performance.
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
    { data: existingShifts },
    { data: holidays },
  ] = await Promise.all([
    supabase.from('employees').select('*'),
    supabase.from('time_off_requests').select('*'),
    supabase.from('staffing_requirements').select('*'),
    supabase.from('shift_options').select('*'),
    supabase.from('individual_shifts').select('*').eq('schedule_period_id', periodId),
    supabase.from('holidays').select('*'),
  ])

  if (!employees || !timeOffRequests || !staffingRequirements || !shiftOptions || !existingShifts || !holidays) {
    throw new Error('Failed to fetch required data')
  }

  const tracking = initializeTracking(employees.map(e => e.id))

  return {
    supabase,
    periodId,
    start_date: params.start_date,
    end_date: params.end_date,
    employees,
    timeOffRequests,
    staffingRequirements,
    shiftOptions,
    existingShifts,
    weeklyHours: tracking.weeklyHours,
    shiftPatterns: tracking.shiftPatterns,
    holidays,
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
 * Batch assign shifts within a transaction.
 * Handles multiple shift assignments atomically and updates tracking information.
 */
async function batchAssignShifts(
  context: GenerationContext,
  assignments: { employeeId: string; shiftOptionId: string; date: string }[]
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
          assignments.map(({ employeeId, shiftOptionId, date }) => ({
            employee_id: employeeId,
            shift_option_id: shiftOptionId,
            schedule_period_id: periodId,
            date,
            status: 'scheduled'
          }))
        )

      if (insertError) throw insertError

      // Update tracking info in memory
      for (const { employeeId, shiftOptionId, date } of assignments) {
        const shiftOption = context.shiftOptions.find(opt => opt.id === shiftOptionId)
        if (!shiftOption) {
          throw new Error(`Failed to find shift option for id: ${shiftOptionId}`)
        }

        context.weeklyHours = updateWeeklyHours(
          context.weeklyHours,
          employeeId,
          date,
          shiftOption.duration_hours
        )
        context.shiftPatterns = updateShiftPattern(
          context.shiftPatterns,
          employeeId,
          date
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
  // Initialize context
  const context = await initializeContext(supabase, periodId, params)
  const { start_date, end_date } = context

  // Validate schedule period
  if (!validateSchedulePeriod(start_date, end_date)) {
    throw new Error("Invalid schedule period: Start date must be before end date, and the period cannot exceed 6 months.")
  }

  const results: ScheduleGenerationResult = {
    shifts: [],
    conflicts: [],
    staffing_gaps: [],
    assignedShifts: 0,
    unfilledRequirements: 0,
    errors: [],
    success: true
  }

  // Process each day in the period
  let currentDate = new Date(start_date)
  const endDateTime = new Date(end_date)

  while (isBefore(currentDate, endDateTime) || currentDate.toDateString() === endDateTime.toDateString()) {
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    
    // Check if current date is a holiday
    const isHoliday = isHolidayDate(currentDate, context.holidays)

    // Get requirements for this day
    const requirements = getApplicableRequirements(
      dateStr,
      context.staffingRequirements,
      isHoliday
    )

    // Process each requirement
    for (const requirement of requirements) {
      const shiftOptions = getMatchingShiftOptions(requirement, context.shiftOptions)

      if (shiftOptions.length === 0) {
        results.errors.push(`No matching shift options found for requirement ID ${requirement.id} on ${dateStr}`)
        results.success = false
        continue
      }

      // Get and score available employees
      const availableEmployees = await getAvailableEmployeesForShift(context, dateStr, shiftOptions[0])
      const scoredEmployees = scoreEmployeesForShift(context, dateStr, shiftOptions[0], availableEmployees)
      scoredEmployees.sort((a, b) => b.score - a.score)

      // Prepare shift assignments
      const assignments: { employeeId: string; shiftOptionId: string; date: string }[] = []
      let assignedCount = 0
      let supervisorsAssigned = 0

      for (const scored of scoredEmployees) {
        if (assignedCount >= requirement.min_total_staff && supervisorsAssigned >= requirement.min_supervisors) {
          break
        }

        if (requirement.min_supervisors > 0 && 
            scored.employee.role === 'supervisor' && 
            supervisorsAssigned < requirement.min_supervisors) {
          assignments.push({
            employeeId: scored.employee.id,
            shiftOptionId: scored.shiftOption.id,
            date: dateStr
          })
          assignedCount++
          supervisorsAssigned++
        } else if (assignedCount < requirement.min_total_staff) {
          assignments.push({
            employeeId: scored.employee.id,
            shiftOptionId: scored.shiftOption.id,
            date: dateStr
          })
          assignedCount++
        }
      }

      // Batch assign shifts
      if (assignments.length > 0) {
        const { error } = await batchAssignShifts(context, assignments)
        if (error) {
          results.errors.push(error.message)
          results.success = false
        } else {
          results.assignedShifts += assignments.length
        }
      }

      // Handle unfilled requirements
      if (assignedCount < requirement.min_total_staff || supervisorsAssigned < requirement.min_supervisors) {
        results.unfilledRequirements++
        await handleUnfilledRequirement(context, dateStr, requirement)
      }
    }

    currentDate = addDays(currentDate, 1)
  }

  return results
} 