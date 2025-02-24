import { supabase } from '@/lib/supabase/client'
import type { 
  IndividualShift, 
  ShiftWithDetails, 
  ShiftUpdateData,
  GetShiftsOptions,
  SearchShiftsOptions 
} from './types'

// Get all shifts with employee and shift option details
export async function getShifts(): Promise<ShiftWithDetails[]> {
  const { data, error } = await supabase
    .from('individual_shifts')
    .select(`
      *,
      employee:employees(*),
      shift_option:shift_options(*)
    `)
    .order('start_time', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as ShiftWithDetails[]
}

// Get a single shift by ID
export async function getShiftById(id: string): Promise<ShiftWithDetails | null> {
  const { data, error } = await supabase
    .from('individual_shifts')
    .select(`
      *,
      employee:employees(*),
      shift_option:shift_options(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as unknown as ShiftWithDetails
}

// Update a shift
export async function updateShift(id: string, updateData: ShiftUpdateData): Promise<void> {
  const { error } = await supabase
    .from('individual_shifts')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
}

// Create a new shift
export async function createShift(
  data: Omit<IndividualShift, 'id' | 'created_at' | 'updated_at'>
): Promise<void> {
  const { error } = await supabase
    .from('individual_shifts')
    .insert({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

  if (error) throw error
}

// Delete a shift
export async function deleteShift(id: string): Promise<void> {
  const { error } = await supabase
    .from('individual_shifts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get shifts for a specific employee
export async function getEmployeeShifts(employeeId: string): Promise<ShiftWithDetails[]> {
  const { data, error } = await supabase
    .from('individual_shifts')
    .select(`
      *,
      employee:employees(*),
      shift_option:shift_options(*)
    `)
    .eq('employee_id', employeeId)
    .order('start_time', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as ShiftWithDetails[]
}

// Get shifts for a date range
export async function getShiftsInRange(
  startDate: string, 
  endDate: string
): Promise<ShiftWithDetails[]> {
  const { data, error } = await supabase
    .from('individual_shifts')
    .select(`
      *,
      employee:employees(*),
      shift_option:shift_options(*)
    `)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('start_time', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as ShiftWithDetails[]
}

// Get shifts with options
export async function getShiftsWithOptions(options: GetShiftsOptions = {}) {
  let query = supabase
    .from('individual_shifts')
    .select(
      options.includeEmployee
        ? `*, employee:employees(id, first_name, last_name)`
        : '*'
    )

  if (options.startDate) {
    query = query.gte('actual_start_time', options.startDate.toISOString())
  }
  
  if (options.endDate) {
    query = query.lte('actual_end_time', options.endDate.toISOString())
  }
  
  if (options.employeeId) {
    query = query.eq('employee_id', options.employeeId)
  }

  const { data, error } = await query.order('start_time', { ascending: true })

  if (error) throw error
  return { data: data ?? [], error: null }
}

// Search shifts with criteria
export async function searchShifts(options: SearchShiftsOptions = {}) {
  let query = supabase
    .from('individual_shifts')
    .select(`
      *,
      employee:employees(id, first_name, last_name)
    `)

  if (options.scheduleId) {
    query = query.eq('schedule_id', options.scheduleId)
  }
  
  if (options.employeeId) {
    query = query.eq('employee_id', options.employeeId)
  }
  
  if (options.startDate) {
    query = query.gte('start_time', options.startDate)
  }
  
  if (options.endDate) {
    query = query.lte('end_time', options.endDate)
  }

  const { data, error } = await query.order('start_time', { ascending: true })

  if (error) throw error
  return { data: data ?? [], error: null }
}

// Get shift counts for a date range
export async function getShiftCounts(startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('individual_shifts')
    .select('actual_start_time, actual_end_time')
    .gte('actual_start_time', startDate.toISOString())
    .lte('actual_end_time', endDate.toISOString())

  if (error) throw error
  if (!data) return { data: [], error: null }

  // Process the shifts to count employees per hour
  const hourCounts = new Map<string, number>()
  
  data.forEach(shift => {
    if (!shift.actual_start_time || !shift.actual_end_time) return

    const start = new Date(shift.actual_start_time)
    const end = new Date(shift.actual_end_time)
    
    const current = new Date(start)
    while (current < end) {
      const key = current.toISOString()
      hourCounts.set(key, (hourCounts.get(key) || 0) + 1)
      current.setHours(current.getHours() + 1)
    }
  })

  return { 
    data: Array.from(hourCounts.entries()).map(([hour, count]) => ({
      hour: new Date(hour),
      count
    })),
    error: null
  }
} 