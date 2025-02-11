/**
 * Service-level Supabase Client
 * 
 * This module provides a Supabase client configured with the service role key
 * for administrative operations. This should ONLY be used in server-side code
 * that requires elevated privileges.
 * 
 * @deprecated Use the admin API routes instead for administrative operations
 */

import { createClient } from '@supabase/supabase-js'
import { type Database } from '@/types/supabase/database'
import { type ShiftUpdateData } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
})

export async function getEmployeeShifts(employeeId: string) {
  const { data, error } = await supabase
    .from('individual_shifts')
    .select('*')
    .eq('employee_id', employeeId)
  
  if (error) throw error
  return data
}

export async function updateShift(id: string, data: ShiftUpdateData) {
  const { data: updatedShift, error } = await supabase
    .from('individual_shifts')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return updatedShift
}

export type TimeOffRequestData = Database['public']['Tables']['time_off_requests']['Insert']

export async function createTimeOffRequest(data: TimeOffRequestData) {
  const { data: newRequest, error } = await supabase
    .from('time_off_requests')
    .insert(data)
    .select()
    .single()
  
  if (error) throw error
  return newRequest
}

// Regular operations that don't require service role
export type { Database } from '@/types/supabase/database'

export async function getEmployeeSchedule(
  employeeId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .from('individual_shifts')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', startDate)
    .lte('date', endDate)
  
  if (error) throw error
  return data
} 