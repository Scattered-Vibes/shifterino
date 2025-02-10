/**
 * Regular Supabase operations that don't require service role access.
 * These operations use the standard client with RLS policies.
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export type ShiftUpdateData = {
  actual_start_time?: string | null
  actual_end_time?: string | null
}

export type TimeOffRequestData = {
  employee_id: string
  start_date: string
  end_date: string
  reason: string
}

export async function getEmployeeSchedule(
  employeeId: string,
  startDate: string,
  endDate: string
) {
  const supabase = createClient()
  return supabase
    .from('individual_shifts')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', startDate)
    .lte('date', endDate)
}

export async function updateShift(id: string, data: ShiftUpdateData) {
  const supabase = createClient()
  return supabase
    .from('individual_shifts')
    .update(data)
    .eq('id', id)
    .single()
}

export async function createTimeOffRequest(data: TimeOffRequestData) {
  const supabase = createClient()
  return supabase
    .from('time_off_requests')
    .insert([data])
    .single()
} 