'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  ScheduleGenerationParams,
  ScheduleGenerationResult,
  IndividualShift
} from '@/types/scheduling'
import { validateSchedulePeriod } from '@/lib/scheduling/helpers'
import {
  initializeTracking,
  updateWeeklyHours,
  updateShiftPattern,
  canAssignShift
} from '@/lib/scheduling/tracking'
import { calculateShiftScore } from '@/lib/scheduling/scoring'
import { checkShiftConflicts, resolveConflicts } from '@/lib/scheduling/conflicts'

const schedulePeriodIdSchema = z.string().uuid()

export async function generateSchedule(
  params: ScheduleGenerationParams
): Promise<ScheduleGenerationResult> {
  try {
    const validatedId = schedulePeriodIdSchema.parse(params.schedulePeriodId)
    const supabase = createClient()

    // Fetch schedule period
    const { data: schedulePeriod, error: schedulePeriodError } = await supabase
      .from('schedule_periods')
      .select('*')
      .eq('id', validatedId)
      .single()

    if (schedulePeriodError || !schedulePeriod) {
      throw new Error('Schedule period not found')
    }

    // Validate schedule period dates
    if (!validateSchedulePeriod(schedulePeriod.start_date, schedulePeriod.end_date)) {
      throw new Error('Invalid schedule period dates')
    }

    // Fetch staffing requirements
    const { data: staffingRequirements, error: staffingRequirementsError } = await supabase
      .from('staffing_requirements')
      .select(`
        *,
        shift_options (
          id,
          start_time,
          end_time,
          duration_hours,
          crosses_midnight
        )
      `)
      .order('start_time')

    if (staffingRequirementsError || !staffingRequirements) {
      throw new Error('Failed to fetch staffing requirements')
    }

    // Fetch active employees
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)

    if (employeesError || !employees) {
      throw new Error('Failed to fetch employees')
    }

    // Fetch shift options
    const { data: shiftOptions, error: shiftOptionsError } = await supabase
      .from('shift_options')
      .select('*')

    if (shiftOptionsError || !shiftOptions) {
      throw new Error('Failed to fetch shift options')
    }

    // Fetch time-off requests
    const { data: timeOffRequests, error: timeOffError } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('status', 'APPROVED')
      .lte('start_date', schedulePeriod.end_date)
      .gte('end_date', schedulePeriod.start_date)

    if (timeOffError) {
      throw new Error('Failed to fetch time-off requests')
    }

    // Initialize tracking
    let tracking = initializeTracking(employees)
    
    const scheduledShifts: IndividualShift[] = []
    const unfilledRequirements: { date: string; requirementId: string; shortfall: number }[] = []
    
    // Begin transaction
    const { error: transactionError } = await supabase.rpc('begin_transaction')
    if (transactionError) throw new Error('Failed to begin transaction')

    try {
      const startDate = new Date(schedulePeriod.start_date)
      const endDate = new Date(schedulePeriod.end_date)

      for (let currentDate = startDate; currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
        const formattedDate = currentDate.toISOString().split('T')[0]
        
        // Get requirements for the current date (considering holidays)
        const isHoliday = false // TODO: Implement holiday checking
        const applicableRequirements = staffingRequirements.filter(req => req.is_holiday === isHoliday)

        for (const requirement of applicableRequirements) {
          const matchingShiftOptions = shiftOptions.filter(option => 
            option.start_time === requirement.start_time && 
            option.end_time === requirement.end_time
          )

          if (matchingShiftOptions.length === 0) {
            console.warn(`No matching shift options found for requirement: ${requirement.id} on ${formattedDate}`)
            continue
          }

          let assignedStaffCount = 0
          let assignedSupervisorsCount = 0

          // Get available employees and score them
          const availableEmployees = employees.filter(emp => {
            const isAvailable = !timeOffRequests.some(req =>
              req.employee_id === emp.id &&
              new Date(formattedDate) >= new Date(req.start_date) &&
              new Date(formattedDate) <= new Date(req.end_date)
            )

            if (!isAvailable) return false

            // Check if employee can be assigned based on patterns and hours
            return matchingShiftOptions.some(option =>
              canAssignShift(emp, formattedDate, option, tracking.weeklyHours, tracking.shiftPatterns)
            )
          })

          // Score and sort employees
          const scoredEmployees = availableEmployees.flatMap(employee => 
            matchingShiftOptions.map(shiftOption => 
              calculateShiftScore(employee, shiftOption, formattedDate, scheduledShifts)
            )
          ).sort((a, b) => b.score - a.score)

          // First, assign supervisors if needed
          if (requirement.min_supervisors > 0) {
            const supervisorScores = scoredEmployees.filter(scored => scored.employee.role === 'SUPERVISOR')
            
            for (const scored of supervisorScores) {
              if (assignedSupervisorsCount >= requirement.min_supervisors) break

              // Check for conflicts
              const { conflicts, error: conflictError } = await checkShiftConflicts({
                employeeId: scored.employee.id,
                startTime: `${formattedDate}T${scored.shiftOption.start_time}`,
                endTime: scored.shiftOption.crosses_midnight
                  ? `${new Date(currentDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}T${scored.shiftOption.end_time}`
                  : `${formattedDate}T${scored.shiftOption.end_time}`,
                shiftOptionId: scored.shiftOption.id
              })

              if (conflictError) {
                console.error('Conflict check error:', conflictError)
                continue
              }

              const resolution = resolveConflicts(conflicts, scored.employee, scored.shiftOption)
              
              if (!resolution.canProceed || resolution.requiresOverride) {
                console.warn(`Skipping assignment due to conflicts: ${resolution.message}`)
                continue
              }

              const shift: IndividualShift = {
                employee_id: scored.employee.id,
                shift_option_id: scored.shiftOption.id,
                schedule_period_id: validatedId,
                date: formattedDate,
                status: 'SCHEDULED',
                actual_start_time: `${formattedDate}T${scored.shiftOption.start_time}`,
                actual_end_time: scored.shiftOption.crosses_midnight
                  ? `${new Date(currentDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}T${scored.shiftOption.end_time}`
                  : `${formattedDate}T${scored.shiftOption.end_time}`,
                is_overtime: false // Will be calculated based on weekly hours
              }

              const { error: insertError } = await supabase
                .from('individual_shifts')
                .insert([shift])

              if (insertError) throw new Error(`Failed to insert shift: ${insertError.message}`)

              scheduledShifts.push(shift)
              assignedSupervisorsCount++
              assignedStaffCount++

              // Update tracking
              tracking = {
                weeklyHours: updateWeeklyHours(
                  tracking.weeklyHours,
                  scored.employee.id,
                  formattedDate,
                  scored.shiftOption.duration_hours
                ),
                shiftPatterns: updateShiftPattern(
                  tracking.shiftPatterns,
                  scored.employee.id,
                  formattedDate
                )
              }
            }
          }

          // Then assign regular staff
          const dispatcherScores = scoredEmployees.filter(scored => 
            scored.employee.role === 'DISPATCHER' &&
            !scheduledShifts.some(s => s.employee_id === scored.employee.id && s.date === formattedDate)
          )

          for (const scored of dispatcherScores) {
            if (assignedStaffCount >= requirement.min_total_staff) break

            // Check for conflicts
            const { conflicts, error: conflictError } = await checkShiftConflicts({
              employeeId: scored.employee.id,
              startTime: `${formattedDate}T${scored.shiftOption.start_time}`,
              endTime: scored.shiftOption.crosses_midnight
                ? `${new Date(currentDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}T${scored.shiftOption.end_time}`
                : `${formattedDate}T${scored.shiftOption.end_time}`,
              shiftOptionId: scored.shiftOption.id
            })

            if (conflictError) {
              console.error('Conflict check error:', conflictError)
              continue
            }

            const resolution = resolveConflicts(conflicts, scored.employee, scored.shiftOption)
            
            if (!resolution.canProceed || resolution.requiresOverride) {
              console.warn(`Skipping assignment due to conflicts: ${resolution.message}`)
              continue
            }

            const shift: IndividualShift = {
              employee_id: scored.employee.id,
              shift_option_id: scored.shiftOption.id,
              schedule_period_id: validatedId,
              date: formattedDate,
              status: 'SCHEDULED',
              actual_start_time: `${formattedDate}T${scored.shiftOption.start_time}`,
              actual_end_time: scored.shiftOption.crosses_midnight
                ? `${new Date(currentDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}T${scored.shiftOption.end_time}`
                : `${formattedDate}T${scored.shiftOption.end_time}`,
              is_overtime: false // Will be calculated based on weekly hours
            }

            const { error: insertError } = await supabase
              .from('individual_shifts')
              .insert([shift])

            if (insertError) throw new Error(`Failed to insert shift: ${insertError.message}`)

            scheduledShifts.push(shift)
            assignedStaffCount++

            // Update tracking
            tracking = {
              weeklyHours: updateWeeklyHours(
                tracking.weeklyHours,
                scored.employee.id,
                formattedDate,
                scored.shiftOption.duration_hours
              ),
              shiftPatterns: updateShiftPattern(
                tracking.shiftPatterns,
                scored.employee.id,
                formattedDate
              )
            }
          }

          // Record unfilled requirements
          if (assignedStaffCount < requirement.min_total_staff) {
            unfilledRequirements.push({
              date: formattedDate,
              requirementId: requirement.id,
              shortfall: requirement.min_total_staff - assignedStaffCount
            })
          }
        }
      }

      // Commit transaction
      const { error: commitError } = await supabase.rpc('commit_transaction')
      if (commitError) throw new Error('Failed to commit transaction')

      revalidatePath('/schedule')
      
      return {
        success: true,
        data: {
          scheduledShifts,
          unfilledRequirements
        }
      }

    } catch (error) {
      // Rollback transaction
      await supabase.rpc('rollback_transaction')
      throw error
    }

  } catch (error) {
    console.error('Schedule generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 