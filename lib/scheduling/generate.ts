import { SupabaseClient } from '@supabase/supabase-js'
import { 
  Employee, 
  ShiftOption, 
  TimeOffRequest, 
  StaffingRequirement,
  ScheduleGenerationParams,
  ScheduleGenerationResult,
  IndividualShift,
  WeeklyHoursTracking,
  ShiftPatternTracking,
  EmployeeRole
} from '@/types/scheduling'
import { 
  getAvailableEmployees, 
  getApplicableRequirements,
  getMatchingShiftOptions,
  validateSchedulePeriod 
} from './helpers'
import { calculateShiftScore, ScoredEmployee } from './scoring'
import { 
  initializeTracking,
  updateWeeklyHours,
  updateShiftPattern,
  canAssignShift
} from './tracking'

interface GenerationContext {
  supabase: SupabaseClient
  periodId: string
  startDate: string
  endDate: string
  employees: Employee[]
  timeOffRequests: TimeOffRequest[]
  staffingRequirements: StaffingRequirement[]
  shiftOptions: ShiftOption[]
  existingShifts: IndividualShift[]
  weeklyHours: WeeklyHoursTracking
  shiftPatterns: ShiftPatternTracking
}

async function initializeContext(
  supabase: SupabaseClient,
  periodId: string,
  _params: ScheduleGenerationParams // Prefix with _ to indicate unused
): Promise<GenerationContext> {
  // Fetch all required data
  const [
    { data: employees },
    { data: timeOffRequests },
    { data: staffingRequirements },
    { data: shiftOptions },
    { data: existingShifts },
    { data: period }
  ] = await Promise.all([
    supabase.from('employees').select('*'),
    supabase.from('time_off_requests').select('*'),
    supabase.from('staffing_requirements').select('*'),
    supabase.from('shift_options').select('*'),
    supabase.from('individual_shifts').select('*'),
    supabase.from('schedule_periods').select('*').eq('id', periodId).single()
  ])

  if (!period || !employees || !staffingRequirements || !shiftOptions) {
    throw new Error('Failed to fetch required data')
  }

  const { weeklyHours, shiftPatterns } = initializeTracking(employees)

  return {
    supabase,
    periodId,
    startDate: period.start_date,
    endDate: period.end_date,
    employees,
    timeOffRequests: timeOffRequests || [],
    staffingRequirements,
    shiftOptions,
    existingShifts: existingShifts || [],
    weeklyHours,
    shiftPatterns
  }
}

async function assignShift(
  context: GenerationContext,
  employeeId: string,
  shiftOptionId: string,
  date: string
): Promise<{ error?: Error }> {
  const { supabase, periodId } = context
  
  try {
    const { error } = await supabase
      .from('individual_shifts')
      .insert({
        employee_id: employeeId,
        shift_option_id: shiftOptionId,
        schedule_period_id: periodId,
        date,
        status: 'scheduled'
      })
    
    if (error) throw error
    return {}
  } catch (error) {
    return { error: error instanceof Error ? error : new Error('Failed to assign shift') }
  }
}

async function handleUnfilledRequirement(
  context: GenerationContext,
  date: string,
  requirementId: string
): Promise<void> {
  const { supabase } = context
  
  // Log the unfilled requirement
  await supabase
    .from('staffing_alerts')
    .insert({
      date,
      requirement_id: requirementId,
      alert_type: 'UNFILLED_REQUIREMENT',
      status: 'OPEN'
    })
}

export async function generateSchedule(
  supabase: SupabaseClient,
  periodId: string,
  params: ScheduleGenerationParams
): Promise<ScheduleGenerationResult> {
  // Initialize context with all required data
  const context = await initializeContext(supabase, periodId, params)
  const { startDate, endDate } = context
  
  // Validate schedule period
  if (!validateSchedulePeriod(startDate, endDate)) {
    throw new Error('Invalid schedule period')
  }

  const results = {
    assignedShifts: 0,
    unfilledRequirements: 0,
    errors: [] as string[],
    success: true // Add success field
  }

  // Generate schedule for each day in the period
  const currentDate = new Date(startDate)
  const endDateTime = new Date(endDate)

  while (currentDate <= endDateTime) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const isHoliday = false // Remove params.holidays check since it's not in the type

    // Get requirements for this day
    const requirements = getApplicableRequirements(
      dateStr,
      context.staffingRequirements,
      isHoliday
    )

    // Process each requirement
    for (const requirement of requirements) {
      const shiftOptions = getMatchingShiftOptions(requirement, context.shiftOptions)
      
      // Get available employees
      const availableEmployees = getAvailableEmployees(
        context.employees,
        dateStr,
        context.timeOffRequests
      )

      // Score each employee for each shift option
      const scoredEmployees: ScoredEmployee[] = []
      
      for (const employee of availableEmployees) {
        for (const shiftOption of shiftOptions) {
          // Check if employee can take this shift
          if (!canAssignShift(
            employee,
            dateStr,
            shiftOption,
            context.weeklyHours,
            context.shiftPatterns
          )) {
            continue
          }

          // Calculate score
          const score = calculateShiftScore(
            employee,
            shiftOption,
            dateStr,
            context.existingShifts
          )
          
          scoredEmployees.push(score)
        }
      }

      // Sort by score and assign shifts
      scoredEmployees.sort((a, b) => b.score - a.score)
      
      let assignedCount = 0
      let supervisorAssigned = false
      
      for (const scored of scoredEmployees) {
        if (assignedCount >= requirement.min_total_staff) break
        
        // Check if we need a supervisor and this employee is one
        if (!supervisorAssigned && requirement.min_supervisors > 0 && 
            scored.employee.role === ('supervisor' as EmployeeRole)) {
          
          const { error } = await assignShift(
            context,
            scored.employee.id,
            scored.shiftOption.id,
            dateStr
          )
          
          if (!error) {
            supervisorAssigned = true
            assignedCount++
            results.assignedShifts++
            
            // Update tracking
            context.weeklyHours = updateWeeklyHours(
              context.weeklyHours,
              scored.employee.id,
              dateStr,
              scored.shiftOption.duration_hours
            )
            
            context.shiftPatterns = updateShiftPattern(
              context.shiftPatterns,
              scored.employee.id,
              dateStr
            )
          }
        }
        // Assign regular staff
        else if (assignedCount < requirement.min_total_staff) {
          const { error } = await assignShift(
            context,
            scored.employee.id,
            scored.shiftOption.id,
            dateStr
          )
          
          if (!error) {
            assignedCount++
            results.assignedShifts++
            
            // Update tracking
            context.weeklyHours = updateWeeklyHours(
              context.weeklyHours,
              scored.employee.id,
              dateStr,
              scored.shiftOption.duration_hours
            )
            
            context.shiftPatterns = updateShiftPattern(
              context.shiftPatterns,
              scored.employee.id,
              dateStr
            )
          }
        }
      }

      // Handle unfilled requirements
      if (assignedCount < requirement.min_total_staff || 
          (!supervisorAssigned && requirement.min_supervisors > 0)) {
        results.unfilledRequirements++
        await handleUnfilledRequirement(context, dateStr, requirement.id)
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return results
} 