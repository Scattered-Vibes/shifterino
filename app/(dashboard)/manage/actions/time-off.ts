'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface TimeOffRequest {
  employee_id: string
  start_date: string // YYYY-MM-DD format
  end_date: string // YYYY-MM-DD format
  reason: string
  status?: 'pending' | 'approved' | 'rejected'
}

export async function createTimeOffRequest(request: Omit<TimeOffRequest, 'status'>) {
  const supabase = createClient()

  try {
    // Get current user for debugging
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get employee record for debugging
    const { data: employee } = await supabase
      .from('employees')
      .select('id, auth_id')
      .eq('auth_id', user?.id)
      .single()
    
    console.log('Debug Info:', {
      requestEmployeeId: request.employee_id,
      currentUser: user?.id,
      employeeRecord: employee,
      requestData: request
    })

    // Validate date format
    const startDate = new Date(request.start_date)
    const endDate = new Date(request.end_date)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date format. Please use YYYY-MM-DD format.')
    }

    if (endDate < startDate) {
      throw new Error('End date cannot be before start date.')
    }

    const { data, error } = await supabase
      .from('time_off_requests')
      .insert([{ 
        ...request, 
        status: 'pending',
        start_date: request.start_date, // Already in YYYY-MM-DD format
        end_date: request.end_date // Already in YYYY-MM-DD format
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating time off request:', error)
      throw error
    }

    revalidatePath('/time-off')
    revalidatePath('/manage')
    return data
  } catch (error) {
    console.error('Error in createTimeOffRequest:', error)
    throw error
  }
}

export async function updateTimeOffRequest(
  requestId: string,
  status: 'approved' | 'rejected'
) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('time_off_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/time-off')
    revalidatePath('/manage')
    return data
  } catch (error) {
    console.error('Error in updateTimeOffRequest:', error)
    throw error
  }
}

export async function getTimeOffRequests(employeeId?: string) {
  const supabase = createClient()

  try {
    let query = supabase
      .from('time_off_requests')
      .select(`
        *,
        employee:employees(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data, error } = await query

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error in getTimeOffRequests:', error)
    throw error
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
    // Validate date format
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format. Please use YYYY-MM-DD format.')
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

    if (error) throw error

    return data.length > 0
  } catch (error) {
    console.error('Error in checkTimeOffConflicts:', error)
    throw error
  }
} 