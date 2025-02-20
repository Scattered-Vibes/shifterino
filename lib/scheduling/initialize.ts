import { SupabaseClient } from '@supabase/supabase-js'
import type {
  GenerationContext,
  ScheduleGenerationParams,
  ShiftPatternState
} from '@/types/scheduling/schedule'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'
import { convertEmployeePatternType } from '@/lib/scheduling'

export async function initializeContext(
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

  // Fetch existing individual_shifts within the period
  const { data: existingShifts, error: existingShiftsError } = await supabase
    .from('individual_shifts')
    .select('*, employee:employees(*), shift_option:shift_options(*)')
    .in('employee_id', params.employeeIds)
    .gte('date', period.start_date)
    .lte('date', period.end_date);

  if (existingShiftsError) {
    throw new AppError(
      'Failed to fetch existing shifts',
      ErrorCode.DATABASE,
      { details: existingShiftsError }
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

  // Fetch staffing requirements
  const { data: requirements, error: requirementsError } = await supabase
    .from('staffing_requirements')
    .select('*')

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
  const shiftPatterns: Record<string, ShiftPatternState> = {}

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