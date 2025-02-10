'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { handleError, ErrorCode } from '@/lib/utils/error-handler'
import {
  timeOffRequestSchema,
  timeOffConflictCheckSchema,
  type TimeOffRequest,
  type TimeOffConflictCheck
} from '@/lib/validations/schemas'

export async function createTimeOffRequest(input: Omit<TimeOffRequest, 'status'>) {
  const supabase = createClient()

  try {
    // Validate input
    const validatedData = timeOffRequestSchema.parse({
      ...input,
      status: 'pending' // Add default status
    })

    // Check for conflicts first
    const { data: hasConflicts, error: conflictError } = await checkTimeOffConflicts({
      employee_id: validatedData.employee_id,
      start_date: validatedData.start_date,
      end_date: validatedData.end_date
    })

    if (conflictError) {
      throw conflictError
    }

    if (hasConflicts) {
      throw handleError({
        code: ErrorCode.CONFLICT,
        message: 'Time off request conflicts with existing approved request'
      })
    }

    // Create the request
    const { data, error } = await supabase
      .from('time_off_requests')
      .insert([validatedData])
      .select()
      .single()

    if (error) {
      throw handleError(error)
    }

    revalidatePath('/time-off')
    revalidatePath('/manage')
    return { data: data as TimeOffRequest, error: null }
  } catch (error) {
    const appError = handleError(error)
    return { data: null, error: appError }
  }
}

export async function checkTimeOffConflicts(input: Omit<TimeOffConflictCheck, 'exclude_request_id'> & { exclude_request_id?: string }) {
  const supabase = createClient()

  try {
    // Validate input
    const validatedData = timeOffConflictCheckSchema.parse(input)

    // Build query
    let query = supabase
      .from('time_off_requests')
      .select()
      .eq('employee_id', validatedData.employee_id)
      .eq('status', 'approved')
      .or(`start_date.lte.${validatedData.end_date},end_date.gte.${validatedData.start_date}`)

    // Only add the neq clause if exclude_request_id is provided
    if (validatedData.exclude_request_id) {
      query = query.neq('id', validatedData.exclude_request_id)
    }

    const { data, error } = await query

    if (error) {
      throw handleError(error)
    }

    return { data: data.length > 0, error: null }
  } catch (error) {
    const appError = handleError(error)
    return { data: null, error: appError }
  }
}

export async function updateTimeOffRequest(
  requestId: string,
  status: 'approved' | 'rejected'
) {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('time_off_requests')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (error) {
      throw handleError(error)
    }

    revalidatePath('/time-off')
    revalidatePath('/manage')
    return { data: true, error: null }
  } catch (error) {
    const appError = handleError(error)
    return { data: null, error: appError }
  }
}

export async function getTimeOffRequests(employeeId?: string) {
  const supabase = createClient()

  try {
    let query = supabase
      .from('time_off_requests')
      .select(
        `
        *,
        employee:employees (
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .order('created_at', { ascending: false })

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data, error } = await query

    if (error) {
      throw handleError(error)
    }

    return { data: data as TimeOffRequest[], error: null }
  } catch (error) {
    const appError = handleError(error)
    return { data: null, error: appError }
  }
}
