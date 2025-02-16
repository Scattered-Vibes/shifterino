import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase/database'

type SchedulePeriod = Database['public']['Tables']['schedule_periods']['Row']

interface QueryOptions {
  startDate?: string
  endDate?: string
  isActive?: boolean
}

export async function getSchedules(options: QueryOptions = {}) {
  const supabase = await createServerSupabaseClient()
  const query = supabase
    .from('schedule_periods')
    .select('*')
    
  if (options.startDate) {
    query.gte('start_date', options.startDate)
  }
  
  if (options.endDate) {
    query.lte('end_date', options.endDate)
  }
  
  if (options.isActive !== undefined) {
    query.eq('is_active', options.isActive)
  }
  
  const { data, error } = await query
  
  if (error) {
    throw error
  }
  
  return data
}

export async function getSchedule(scheduleId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('schedule_periods')
    .select('*')
    .eq('id', scheduleId)
    .single()
  
  if (error) {
    throw error
  }
  
  return data
}

export async function createSchedule(data: Omit<SchedulePeriod, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createServerSupabaseClient()
  const { data: newSchedule, error } = await supabase
    .from('schedule_periods')
    .insert([data])
    .select()
    .single()
  
  if (error) {
    throw error
  }
  
  return newSchedule
}

export async function updateSchedule(scheduleId: string, data: Partial<Omit<SchedulePeriod, 'id' | 'created_at' | 'updated_at'>>) {
  const supabase = await createServerSupabaseClient()
  const { data: updatedSchedule, error } = await supabase
    .from('schedule_periods')
    .update(data)
    .eq('id', scheduleId)
    .select()
    .single()
  
  if (error) {
    throw error
  }
  
  return updatedSchedule
}

export async function deleteSchedule(scheduleId: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('schedule_periods')
    .delete()
    .eq('id', scheduleId)
  
  if (error) {
    throw error
  }
  
  return true
}

export async function getScheduleShifts(scheduleId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('individual_shifts')
    .select('*, shift_option:shift_options(*)')
    .eq('schedule_period_id', scheduleId)
  
  if (error) {
    throw error
  }
  
  return data
}

export async function getScheduleConflicts(employeeId: string, startDate: Date, endDate: Date) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('individual_shifts')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString())
    .not('status', 'eq', 'cancelled')
  
  if (error) {
    throw error
  }
  
  return data
} 