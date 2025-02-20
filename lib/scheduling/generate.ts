import { SupabaseClient } from '@supabase/supabase-js'
import type {
  Employee,
  ShiftOption,
  TimeOffRequest,
  StaffingRequirement,
  IndividualShift,
  ScheduleGenerationParams,
  ScheduleGenerationResult,
  GenerationContext,
  ShiftEvent,
  ShiftPatternState,
  ShiftStatus,
  ShiftPattern
} from '@/lib/scheduling'
import {
  getAvailableEmployees,
  getApplicableRequirements,
  getMatchingShiftOptions,
  validateSchedulePeriod,
  calculateShiftScore,
  updateWeeklyHours,
  updateShiftPattern,
  canAssignShift,
  isHolidayDate,
  convertEmployeePatternType,
  initializeContext
} from '@/lib/scheduling'
import { format, addDays, parseISO } from 'date-fns'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'

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
  supabase: SupabaseClient,
  periodId: string,
  params: ScheduleGenerationParams
): Promise<ScheduleGenerationResult> {
  try {
    // 1. Validate the schedule period
    if (!validateSchedulePeriod(parseISO(params.startDate), parseISO(params.endDate))) {
      throw new AppError('Invalid schedule period', ErrorCode.INVALID_SCHEDULE_PERIOD)
    }

    // 2. Initialize generation context
    const context = await initializeContext(supabase, periodId, params)

    // 3. Validate required data
    if (!context.employees.length) {
      throw new AppError('No employees available for scheduling', ErrorCode.NO_EMPLOYEES_FOUND)
    }
    if (!context.shiftOptions.length) {
      throw new AppError('No shift options defined', ErrorCode.NO_SHIFT_OPTIONS)
    }
    if (!context.staffingRequirements.length) {
      throw new AppError('No staffing requirements defined', ErrorCode.NO_STAFFING_REQUIREMENTS)
    }

    const assignedShifts: IndividualShift[] = []
    const errors: string[] = []
    let currentDate = parseISO(context.startDate);
    const endDate = parseISO(context.endDate);

    // 4. Generate schedule for each day in the period
    while (currentDate <= endDate) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const isHoliday = isHolidayDate(currentDate, context.holidays);

        // 5. Get applicable requirements for the current day
        const applicableRequirements = getApplicableRequirements(
            context.staffingRequirements,
            currentDate,
            isHoliday
        );

        // 6. Process each requirement
        for (const requirement of applicableRequirements) {
            const matchingShiftOptions = getMatchingShiftOptions(context.shiftOptions, requirement);

            if (matchingShiftOptions.length === 0) {
                errors.push(`No matching shift options for requirement on ${dateStr}`);
                continue;
            }

            // 7. Get and score available employees
            const availableEmployees = getAvailableEmployees(
                context.employees,
                currentDate,
                context.timeOffRequests
            );

            if (availableEmployees.length === 0) {
                errors.push(`No available employees for ${dateStr}`);
                continue;
            }

            // 8. Score and sort employees
            const scoredEmployees = availableEmployees.map((employee: Employee) => ({
                employee,
                shiftOption: matchingShiftOptions[0],
                score: calculateShiftScore(
                    employee,
                    {
                        id: '',
                        employeeId: employee.id,
                        employeeRole: employee.role,
                        start: `${dateStr}T${matchingShiftOptions[0].startTime}:00.000Z`,
                        end: `${dateStr}T${matchingShiftOptions[0].endTime}:00.000Z`,
                        status: 'scheduled' as ShiftStatus,
                        pattern: context.shiftPatterns[employee.id].currentPattern,
                        shiftOptionId: matchingShiftOptions[0].id,
                        title: `${employee.name} - ${matchingShiftOptions[0].category}`
                    },
                    context
                ),
            })).sort((a: ScoredEmployee, b: ScoredEmployee) => b.score - a.score);

            // 9. Assign shifts
            let assignedCount = 0;
            for (const { employee, shiftOption } of scoredEmployees) {
                if (assignedCount >= requirement.minTotalStaff) break;

                if (canAssignShift(employee, shiftOption, currentDate, context)) {
                    const newShift: IndividualShift = {
                        employeeId: employee.id,
                        shiftOptionId: shiftOption.id,
                        date: dateStr,
                        status: 'scheduled',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };

                    assignedShifts.push(newShift);
                    assignedCount++;

                    updateWeeklyHours(context.weeklyHours, employee.id, dateStr, shiftOption.durationHours);
                    updateShiftPattern(context.shiftPatterns, employee.id, dateStr, shiftOption);
                }
            }
        }

        currentDate = addDays(currentDate, 1);
    }

    // 10. Save the generated shifts
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

    return {
        success: errors.length === 0,
        shiftsGenerated: assignedShifts.length,
        shifts_generated: assignedShifts.length,
        errors: errors.length > 0 ? errors : undefined,
        warnings: []
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      'An unexpected error occurred during schedule generation',
      ErrorCode.UNKNOWN,
      { details: error }
    );
  }
}

async function findBestEmployee(
    employees: Employee[],
    shiftOptions: ShiftOption[],
    date: Date,
    context: GenerationContext,
    assignedEmployees: Set<string>
): Promise<IndividualShift | null> {
    let bestScore = -1;
    let bestAssignment: IndividualShift | null = null;
    const dateStr = format(date, 'yyyy-MM-dd');

    for (const employee of employees) {
        if (assignedEmployees.has(employee.id)) continue;

        for (const option of shiftOptions) {
            const shiftEvent: ShiftEvent = {
                id: '',
                employeeId: employee.id,
                employeeRole: employee.role,
                start: `${dateStr}T${option.startTime}:00.000Z`,
                end: `${dateStr}T${option.endTime}:00.000Z`,
                status: 'scheduled' as ShiftStatus,
                pattern: context.shiftPatterns[employee.id].currentPattern,
                shiftOptionId: option.id,
                title: `${employee.name} - ${option.category}`
            };

            if (!canAssignShift(employee, option, date, context)) {
                continue;
            }

            const score = calculateShiftScore(employee, shiftEvent, context);

            if (score > bestScore) {
                bestScore = score;
                bestAssignment = {
                    employeeId: employee.id,
                    shiftOptionId: option.id,
                    date: dateStr,
                    status: 'scheduled',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
            }
        }
    }

    return bestAssignment;
}

export type { ScoredEmployee, RequirementGroup };