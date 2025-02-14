import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateSchedule } from '@/lib/schedule/validation'
import { validateShiftPattern } from '@/lib/schedule/shift-pattern'
import { validateWeeklyHours } from '@/lib/schedule/weekly-hours'
import { checkTimeOffConflicts } from '@/lib/schedule/time-off'
import type { ShiftAssignment, StaffingRequirement } from '@/types/schedule'

type ScheduleRequest = {
  assignments: ShiftAssignment[]
  employeeId: string
  startDate: string
  endDate: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, role')
      .eq('auth_id', user.id)
      .single()

    if (employeeError) {
      return new Response('Error fetching employee data', { status: 500 })
    }

    if (!['manager', 'supervisor'].includes(employee.role)) {
      return new Response('Unauthorized', { status: 403 })
    }

    const body = await request.json() as ScheduleRequest
    const { assignments, employeeId, startDate, endDate } = body

    // Get staffing requirements
    const { data: requirements, error: requirementsError } = await supabase
      .from('staffing_requirements')
      .select('*')

    if (requirementsError) {
      return new Response('Failed to fetch staffing requirements', { status: 500 })
    }

    // Get employee shift pattern
    const { data: targetEmployee, error: targetError } = await supabase
      .from('employees')
      .select('shift_pattern')
      .eq('id', employeeId)
      .single()

    if (targetError || !targetEmployee) {
      return new Response('Target employee not found', { status: 404 })
    }

    // Get time off requests
    const { data: timeOffRequests, error: timeOffError } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('start_date', startDate)
      .lte('end_date', endDate)
      .eq('status', 'approved')

    if (timeOffError) {
      return new Response('Failed to fetch time off requests', { status: 500 })
    }

    // Validate schedule against requirements
    const scheduleValidation = validateSchedule(
      assignments,
      requirements as StaffingRequirement[]
    )

    if (!scheduleValidation.isValid) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid schedule',
          details: scheduleValidation.errors
        }),
        { status: 400 }
      )
    }

    // Validate shift pattern
    const patternValidation = validateShiftPattern(
      assignments,
      targetEmployee.shift_pattern
    )

    if (!patternValidation.isValid) {
      return new Response(
        JSON.stringify({
          error: 'Invalid shift pattern',
          details: patternValidation.errors
        }),
        { status: 400 }
      )
    }

    // Check weekly hours
    const { data: overtimeApproval } = await supabase
      .from('overtime_approvals')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('week_start', startDate)
      .lte('week_start', endDate)
      .single()

    const hoursValidation = validateWeeklyHours(
      assignments,
      !!overtimeApproval
    )

    if (!hoursValidation.isValid) {
      return new Response(
        JSON.stringify({
          error: 'Weekly hours validation failed',
          details: hoursValidation.errors
        }),
        { status: 400 }
      )
    }

    // Check time off conflicts
    if (timeOffRequests && timeOffRequests.length > 0) {
      const conflicts = timeOffRequests.flatMap(request => 
        checkTimeOffConflicts(request, assignments)
      )

      if (conflicts.length > 0) {
        return new Response(
          JSON.stringify({
            error: 'Schedule conflicts with approved time off',
            details: conflicts.map(c => `Conflict on ${c.date}`)
          }),
          { status: 400 }
        )
      }
    }

    // Create schedule
    const { data: schedule, error: createError } = await supabase
      .from('schedules')
      .insert({
        employee_id: employeeId,
        start_date: startDate,
        end_date: endDate,
        shift_pattern: targetEmployee.shift_pattern,
        created_by: user.id,
        updated_by: user.id,
        status: 'draft'
      })
      .select()
      .single()

    if (createError) {
      return new Response('Failed to create schedule', { status: 500 })
    }

    // Create shift assignments
    const { error: assignError } = await supabase
      .from('shift_assignments')
      .insert(
        assignments.map(assignment => ({
          ...assignment,
          schedule_id: schedule.id
        }))
      )

    if (assignError) {
      // Rollback schedule creation
      await supabase
        .from('schedules')
        .delete()
        .eq('id', schedule.id)

      return new Response('Failed to create shift assignments', { status: 500 })
    }

    return new Response(JSON.stringify(schedule))
  } catch (error) {
    console.error('Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, role')
      .eq('auth_id', user.id)
      .single()

    if (employeeError) {
      return new Response('Error fetching employee data', { status: 500 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build query
    let query = supabase
      .from('schedules')
      .select(`
        *,
        employees (
          first_name,
          last_name,
          email
        ),
        shift_assignments (*)
      `)

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }
    if (startDate) {
      query = query.gte('start_date', startDate)
    }
    if (endDate) {
      query = query.lte('end_date', endDate)
    }

    const { data: schedules, error } = await query

    if (error) {
      return new Response('Failed to fetch schedules', { status: 500 })
    }

    return new Response(JSON.stringify(schedules))
  } catch (error) {
    console.error('Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 