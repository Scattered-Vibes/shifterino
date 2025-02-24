import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase/database'
import { handleError } from '@/lib/utils/error-handler'

type Tables = Database['public']['Tables']
type IndividualShift = Tables['individual_shifts']['Row']
type ShiftOption = Tables['shift_options']['Row']
type Employee = Tables['employees']['Row']
type ShiftStatus = IndividualShift['status']

// Types for shift operations
export interface ShiftWithDetails extends Omit<IndividualShift, 'employee_id' | 'shift_option_id'> {
  employee: Employee
  shift_option: ShiftOption
}

interface ShiftUpdateData {
  employee_id?: string
  shift_option_id?: string
  date?: string
  start_time?: string
  end_time?: string
  status?: ShiftStatus
  notes?: string
}

interface GetShiftsOptions {
  startDate?: Date
  endDate?: Date
  employeeId?: string
  includeEmployee?: boolean
}

interface SearchShiftsOptions {
  scheduleId?: string
  employeeId?: string
  startDate?: string
  endDate?: string
}

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
  return data as unknown as ShiftWithDetails[]
}

// Get a single shift by ID
export async function getShiftById(id: string): Promise<ShiftWithDetails> {
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
export async function updateShift(id: string, updateData: ShiftUpdateData) {
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
export async function createShift(data: Omit<IndividualShift, 'id' | 'created_at' | 'updated_at'>) {
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
export async function deleteShift(id: string) {
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
  return data as unknown as ShiftWithDetails[]
}

// Get shifts for a date range
export async function getShiftsInRange(startDate: string, endDate: string): Promise<ShiftWithDetails[]> {
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
  return data as unknown as ShiftWithDetails[]
}

export const shiftQueries = {
  async getShifts(options: GetShiftsOptions = {}) {
    const { data, error } = await supabase
      .from('individual_shifts')
      .select(
        options.includeEmployee
          ? `*, employees (id, first_name, last_name)`
          : '*'
      )

    if (error) {
      throw error
    }

    if (!data) {
      return { data: [], error: null }
    }

    let filteredData = [...data]

    if (options.startDate) {
      filteredData = filteredData.filter(shift => 
        shift.actual_start_time && new Date(shift.actual_start_time) >= options.startDate!
      )
    }
    if (options.endDate) {
      filteredData = filteredData.filter(shift => 
        shift.actual_end_time && new Date(shift.actual_end_time) <= options.endDate!
      )
    }
    if (options.employeeId) {
      filteredData = filteredData.filter(shift => shift.employee_id === options.employeeId)
    }

    return { data: filteredData, error: null }
  },

  async getShiftConflicts({
    employeeId,
    startTime,
    endTime,
    excludeShiftId
  }: {
    employeeId: string
    startTime: Date
    endTime: Date
    excludeShiftId?: string
  }) {
    const { data, error } = await supabase
      .from('individual_shifts')
      .select('*')
      .eq('employee_id', employeeId)
      .or(`actual_start_time.lte.${endTime.toISOString()},actual_end_time.gte.${startTime.toISOString()}`)

    if (excludeShiftId) {
      data.filter((shift) => shift.id !== excludeShiftId)
    }

    if (error) {
      throw handleError(error)
    }

    return { data, error: null }
  },

  async getShiftsBySchedule(scheduleId: string) {
    const { data, error } = await supabase
      .from('individual_shifts')
      .select('*, employees (id, first_name, last_name)')
      .eq('schedule_id', scheduleId)
      .order('actual_start_time', { ascending: true })

    if (error) {
      throw handleError(error)
    }

    return { data, error: null }
  },

  async getShiftsByEmployee(employeeId: string, startDate?: Date, endDate?: Date) {
    const { data, error } = await supabase
      .from('individual_shifts')
      .select('*')
      .eq('employee_id', employeeId)

    if (startDate) {
      data.filter((shift) => shift.actual_start_time >= startDate.toISOString())
    }
    if (endDate) {
      data.filter((shift) => shift.actual_end_time <= endDate.toISOString())
    }

    if (error) {
      throw handleError(error)
    }

    return { data, error: null }
  },

  async getShiftCounts(startDate: Date, endDate: Date) {
    const { data, error } = await supabase
      .from('individual_shifts')
      .select('actual_start_time, actual_end_time')
      .gte('actual_start_time', startDate.toISOString())
      .lte('actual_end_time', endDate.toISOString())

    if (error) {
      throw handleError(error)
    }

    // Process the shifts to count employees per hour
    const hourCounts = new Map<string, number>()
    
    data.forEach(shift => {
      const start = new Date(shift.actual_start_time as string)
      const end = new Date(shift.actual_end_time as string)
      
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
  },

  async searchShifts(options: SearchShiftsOptions = {}) {
    const { data, error } = await supabase
      .from('individual_shifts')
      .select('*, employees (id, first_name, last_name)')

    if (options.scheduleId) {
      data.filter((shift) => shift.schedule_id === options.scheduleId)
    }
    if (options.employeeId) {
      data.filter((shift) => shift.employee_id === options.employeeId)
    }
    if (options.startDate) {
      data.filter((shift) => shift.start_time >= options.startDate)
    }
    if (options.endDate) {
      data.filter((shift) => shift.end_time <= options.endDate)
    }

    if (error) {
      throw handleError(error)
    }

    return { data, error: null }
  }
} 