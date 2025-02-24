import { supabase } from '@/lib/supabase/client'
import type { 
  TimeOffRequest,
  TimeOffRequestWithEmployee,
  TimeOffUpdateData,
  GetTimeOffRequestsOptions
} from './types'

// Get all time off requests with optional filters
export async function getTimeOffRequests(
  options: GetTimeOffRequestsOptions = {}
): Promise<TimeOffRequestWithEmployee[]> {
  let query = supabase
    .from('time_off_requests')
    .select(
      options.includeEmployee
        ? `*, employee:employees(*)`
        : '*'
    )

  if (options.employeeId) {
    query = query.eq('employee_id', options.employeeId)
  }

  if (options.status) {
    query = query.eq('status', options.status)
  }

  if (options.startDate) {
    query = query.gte('start_date', options.startDate)
  }

  if (options.endDate) {
    query = query.lte('end_date', options.endDate)
  }

  const { data, error } = await query.order('start_date', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as TimeOffRequestWithEmployee[]
}

// Get a single time off request by ID
export async function getTimeOffRequestById(
  id: string
): Promise<TimeOffRequestWithEmployee | null> {
  const { data, error } = await supabase
    .from('time_off_requests')
    .select(`
      *,
      employee:employees(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as unknown as TimeOffRequestWithEmployee
}

// Create a new time off request
export async function createTimeOffRequest(
  data: Omit<TimeOffRequest, 'id' | 'created_at' | 'updated_at' | 'status'>
): Promise<TimeOffRequest> {
  const { data: newRequest, error } = await supabase
    .from('time_off_requests')
    .insert({
      ...data,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return newRequest
}

// Update a time off request
export async function updateTimeOffRequest(
  id: string,
  updateData: TimeOffUpdateData
): Promise<void> {
  const { error } = await supabase
    .from('time_off_requests')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
}

// Delete a time off request
export async function deleteTimeOffRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from('time_off_requests')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get overlapping time off requests for an employee
export async function getOverlappingTimeOffRequests(
  employeeId: string,
  startDate: string,
  endDate: string,
  excludeRequestId?: string
): Promise<TimeOffRequest[]> {
  let query = supabase
    .from('time_off_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'approved')
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

  if (excludeRequestId) {
    query = query.neq('id', excludeRequestId)
  }

  const { data, error } = await query

  if (error) throw error
  return data ?? []
}

// Get time off requests for a date range
export async function getTimeOffRequestsInRange(
  startDate: string,
  endDate: string
): Promise<TimeOffRequestWithEmployee[]> {
  const { data, error } = await supabase
    .from('time_off_requests')
    .select(`
      *,
      employee:employees(*)
    `)
    .gte('start_date', startDate)
    .lte('end_date', endDate)
    .order('start_date', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as TimeOffRequestWithEmployee[]
}

// Approve a time off request
export async function approveTimeOffRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from('time_off_requests')
    .update({
      status: 'approved',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
}

// Reject a time off request
export async function rejectTimeOffRequest(
  id: string,
  reason?: string
): Promise<void> {
  const { error } = await supabase
    .from('time_off_requests')
    .update({
      status: 'rejected',
      notes: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
} 