'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface TimeOffRequest {
  employee_id: string
  start_date: string
  end_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
}

export async function createTimeOffRequest(request: Omit<TimeOffRequest, 'status'>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('time_off_requests')
    .insert([{ ...request, status: 'pending' }])
    .select()
    .single()

  if (error) throw error

  revalidatePath('/manage')
  return data
}

export async function updateTimeOffRequest(
  requestId: string,
  status: 'approved' | 'rejected'
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('time_off_requests')
    .update({ status })
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/manage')
  return data
}

export async function getTimeOffRequests(employeeId?: string) {
  const supabase = createClient()

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
}

export async function checkTimeOffConflicts(
  employeeId: string,
  startDate: string,
  endDate: string,
  excludeRequestId?: string
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('time_off_requests')
    .select()
    .eq('employee_id', employeeId)
    .eq('status', 'approved')
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
    .neq('id', excludeRequestId || '')

  if (error) throw error

  return data.length > 0
} 