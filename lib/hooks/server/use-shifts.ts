import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase/database'

type IndividualShift = Database['public']['Tables']['individual_shifts']['Row']
type ShiftUpdateData = Partial<Pick<IndividualShift, 'status' | 'actual_hours_worked' | 'notes'>>

interface QueryOptions {
  scheduleId?: string
  employeeId?: string
  startDate?: string
  endDate?: string
}

export async function getShifts(options: QueryOptions = {}) {
  const supabase = await createServerSupabaseClient()
  const query = supabase
    .from('individual_shifts')
    .select('*, shift_option:shift_options(*)')
    
  if (options.scheduleId) {
    query.eq('schedule_period_id', options.scheduleId)
  }
  
  if (options.employeeId) {
    query.eq('employee_id', options.employeeId)
  }
  
  if (options.startDate) {
    query.gte('date', options.startDate)
  }
  
  if (options.endDate) {
    query.lte('date', options.endDate)
  }
  
  const { data, error } = await query
  
  if (error) {
    throw error
  }
  
  return data
}

export async function getShift(shiftId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('individual_shifts')
    .select('*, shift_option:shift_options(*)')
    .eq('id', shiftId)
    .single()
  
  if (error) {
    throw error
  }
  
  return data
}

export async function createShift(data: Omit<IndividualShift, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createServerSupabaseClient()
  const { data: newShift, error } = await supabase
    .from('individual_shifts')
    .insert([data])
    .select('*, shift_option:shift_options(*)')
    .single()
  
  if (error) {
    throw error
  }
  
  return newShift
}

export async function updateShift(shiftId: string, data: ShiftUpdateData) {
  const supabase = await createServerSupabaseClient()
  const { data: updatedShift, error } = await supabase
    .from('individual_shifts')
    .update(data)
    .eq('id', shiftId)
    .select('*, shift_option:shift_options(*)')
    .single()
  
  if (error) {
    throw error
  }
  
  return updatedShift
}

export async function deleteShift(shiftId: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('individual_shifts')
    .delete()
    .eq('id', shiftId)
  
  if (error) {
    throw error
  }
  
  return true
}

export async function getShiftConflicts(params: {
  employeeId: string
  startTime: Date
  endTime: Date
  excludeShiftId?: string
}) {
  const supabase = await createServerSupabaseClient()
  const query = supabase
    .from('individual_shifts')
    .select('*, shift_option:shift_options(*)')
    .eq('employee_id', params.employeeId)
    .gte('date', params.startTime.toISOString())
    .lte('date', params.endTime.toISOString())
    .neq('status', 'cancelled')
  
  if (params.excludeShiftId) {
    query.neq('id', params.excludeShiftId)
  }
  
  const { data, error } = await query
  
  if (error) {
    throw error
  }
  
  return data
} 