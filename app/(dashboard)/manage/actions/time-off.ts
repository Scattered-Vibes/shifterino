'use server'

import { revalidatePath } from 'next/cache'

import type { TimeOffRequest } from '@/types/time-off'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { handleError, ErrorCode } from '@/lib/utils/error-handler'

export type CreateTimeOffRequestInput = {
  employee_id: string
  start_date: string
  end_date: string
  reason: string
}

export async function createTimeOffRequest(request: CreateTimeOffRequestInput) {
  const supabase = createClient()

  try {
    // Verify user authentication and get employee ID
    const auth = await requireAuth()

    // For managers/supervisors, allow creating requests for other employees
    // For regular employees, ensure they can only create their own requests
    if (auth.role === 'dispatcher' && request.employee_id !== auth.employeeId) {
      throw handleError({
        code: ErrorCode.AUTH_UNAUTHORIZED,
        message: 'You can only create time off requests for yourself'
      })
    }

    // Validate date format
    const startDate = new Date(request.start_date)
    const endDate = new Date(request.end_date)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw handleError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid date format. Please use YYYY-MM-DD format.'
      })
    }

    if (endDate < startDate) {
      throw handleError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'End date cannot be before start date.'
      })
    }

    const { data, error } = await supabase
      .from('time_off_requests')
      .insert([
        {
          employee_id: request.employee_id,
          start_date: request.start_date,
          end_date: request.end_date,
          reason: request.reason,
          status: 'pending',
        },
      ])
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

export async function checkTimeOffConflicts(
  employeeId: string,
  startDate: string,
  endDate: string,
  excludeRequestId?: string
) {
  const supabase = createClient()

  try {
    // Verify user authentication
    await requireAuth()

    // Validate date format
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw handleError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid date format. Please use YYYY-MM-DD format.'
      })
    }

    // Build query
    let query = supabase
      .from('time_off_requests')
      .select()
      .eq('employee_id', employeeId)
      .eq('status', 'approved')
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

    // Only add the neq clause if excludeRequestId is provided
    if (excludeRequestId) {
      query = query.neq('id', excludeRequestId)
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
