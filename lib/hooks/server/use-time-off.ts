import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase/database'
import { z } from 'zod'

type TimeOffRequest = Database['public']['Tables']['time_off_requests']['Row']

const timeOffRequestSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(1).max(500),
  type: z.enum(['VACATION', 'SICK', 'PERSONAL', 'OTHER'])
})

type TimeOffRequestData = z.infer<typeof timeOffRequestSchema>

interface QueryOptions {
  employeeId?: string
  startDate?: string
  endDate?: string
  status?: TimeOffRequest['status']
}

export async function getTimeOffRequests(options: QueryOptions = {}) {
  const supabase = await createServerSupabaseClient()
  const query = supabase
    .from('time_off_requests')
    .select('*, employee:employees(*)')
    
  if (options.employeeId) {
    query.eq('employee_id', options.employeeId)
  }
  
  if (options.startDate) {
    query.gte('start_date', options.startDate)
  }
  
  if (options.endDate) {
    query.lte('end_date', options.endDate)
  }
  
  if (options.status) {
    query.eq('status', options.status)
  }
  
  const { data, error } = await query
  
  if (error) {
    throw error
  }
  
  return data
}

export async function getTimeOffRequest(requestId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('time_off_requests')
    .select('*, employee:employees(*)')
    .eq('id', requestId)
    .single()
  
  if (error) {
    throw error
  }
  
  return data
}

export async function createTimeOffRequest(data: TimeOffRequestData & { employee_id: string }) {
  const supabase = await createServerSupabaseClient()
  
  // Validate request data
  const validated = timeOffRequestSchema.parse(data)
  
  const { data: newRequest, error } = await supabase
    .from('time_off_requests')
    .insert({
      ...validated,
      employee_id: data.employee_id,
      status: 'pending'
    })
    .select('*, employee:employees(*)')
    .single()
  
  if (error) {
    throw error
  }
  
  return newRequest
}

export async function updateTimeOffRequest(
  requestId: string,
  data: Partial<TimeOffRequestData>
) {
  const supabase = await createServerSupabaseClient()
  
  // Validate partial data
  const validated = timeOffRequestSchema.partial().parse(data)
  
  const { data: updatedRequest, error } = await supabase
    .from('time_off_requests')
    .update(validated)
    .eq('id', requestId)
    .select('*, employee:employees(*)')
    .single()
  
  if (error) {
    throw error
  }
  
  return updatedRequest
}

export async function deleteTimeOffRequest(requestId: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('time_off_requests')
    .delete()
    .eq('id', requestId)
  
  if (error) {
    throw error
  }
  
  return true
}

export async function approveTimeOffRequest(requestId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: updatedRequest, error } = await supabase
    .from('time_off_requests')
    .update({ status: 'approved' })
    .eq('id', requestId)
    .select('*, employee:employees(*)')
    .single()
  
  if (error) {
    throw error
  }
  
  return updatedRequest
}

export async function rejectTimeOffRequest(requestId: string, reason: string) {
  const supabase = await createServerSupabaseClient()
  const { data: updatedRequest, error } = await supabase
    .from('time_off_requests')
    .update({
      status: 'rejected',
      notes: reason
    })
    .eq('id', requestId)
    .select('*, employee:employees(*)')
    .single()
  
  if (error) {
    throw error
  }
  
  return updatedRequest
}

export async function getTimeOffConflicts(employeeId: string, startDate: Date, endDate: Date) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('time_off_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('start_date', startDate.toISOString().split('T')[0])
    .lte('end_date', endDate.toISOString().split('T')[0])
    .neq('status', 'rejected')
  
  if (error) {
    throw error
  }
  
  return data
} 