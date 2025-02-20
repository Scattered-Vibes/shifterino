import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'

type AssignedShift = Database['public']['Tables']['assigned_shifts']['Row']
type ShiftUpdateData = Partial<Pick<AssignedShift, 'date' | 'employee_id' | 'shift_option_id'>>

interface QueryOptions {
  scheduleId?: string
  employeeId?: string
  startDate?: string
  endDate?: string
}

export async function getShifts(options: QueryOptions = {}) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  let query = supabase
    .from('assigned_shifts')
    .select('*, employee:employees(*), shift_option:shift_options(*)')
    
  if (options.scheduleId) {
    throw new Error("scheduleId is no longer a valid search parameter for shifts")
  }
    
  if (options.employeeId) {
    query = query.eq('employee_id', options.employeeId)
  }
    
  if (options.startDate) {
    query = query.gte('shift_date', options.startDate)
  }
    
  if (options.endDate) {
    query = query.lte('shift_date', options.endDate)
  }

  const { data, error } = await query.order('shift_date', { ascending: true })
  
  if (error) {
    throw error
  }
    
  return data as any[]
}

export async function getShift(shiftId: string) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data, error } = await supabase
    .from('assigned_shifts')
    .select('*, employee:employees(*), shift_option:shift_options(*)')
    .eq('id', shiftId)
    .single()

  if (error) {
    throw error
  }
  
  return data as any
}

export async function updateShift(shiftId: string, data: ShiftUpdateData) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: updatedShift, error } = await supabase
    .from('assigned_shifts')
    .update(data)
    .eq('id', shiftId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return updatedShift
}

export async function deleteShift(shiftId: string) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error } = await supabase
    .from('assigned_shifts')
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
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const query = supabase
    .from('assigned_shifts')
    .select('*, shift_option:shift_options(*)')
    .eq('employee_id', params.employeeId)
    .lte('date', params.startTime.toISOString())
    .gte('date', params.endTime.toISOString())

  if (params.excludeShiftId) {
    query.neq('id', params.excludeShiftId)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}