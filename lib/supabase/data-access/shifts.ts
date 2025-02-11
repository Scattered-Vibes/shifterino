import { createClient } from '@/lib/supabase/client'
import type { IndividualShift, ShiftUpdate } from '@/types/models/shift'
import { handleError } from '@/lib/utils/error-handler'

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

export const shiftQueries = {
  async getShifts(options: GetShiftsOptions = {}) {
    const supabase = createClient()
    try {
      let query = supabase
        .from('individual_shifts')
        .select(
          options.includeEmployee
            ? `*, employees (id, first_name, last_name)`
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

      const { data, error } = await query.order('actual_start_time', { ascending: true })
      
      if (error) {
        throw handleError(error)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async getShiftById(shiftId: string) {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('individual_shifts')
        .select('*, employees (id, first_name, last_name)')
        .eq('id', shiftId)
        .single()

      if (error) {
        throw handleError(error)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async createShift(shift: Omit<IndividualShift, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('individual_shifts')
        .insert(shift)
        .select()
        .single()

      if (error) {
        throw handleError(error)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async updateShift(shiftId: string, updateData: ShiftUpdate) {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('individual_shifts')
        .update(updateData)
        .eq('id', shiftId)
        .select()
        .single()

      if (error) {
        throw handleError(error)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async deleteShift(shiftId: string) {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('individual_shifts')
        .delete()
        .eq('id', shiftId)

      if (error) {
        throw handleError(error)
      }

      return { error: null }
    } catch (error) {
      return { error: handleError(error) }
    }
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
    const supabase = createClient()
    try {
      let query = supabase
        .from('individual_shifts')
        .select('*')
        .eq('employee_id', employeeId)
        .or(`actual_start_time.lte.${endTime.toISOString()},actual_end_time.gte.${startTime.toISOString()}`)

      if (excludeShiftId) {
        query = query.neq('id', excludeShiftId)
      }

      const { data, error } = await query

      if (error) {
        throw handleError(error)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async getShiftsBySchedule(scheduleId: string) {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('individual_shifts')
        .select('*, employees (id, first_name, last_name)')
        .eq('schedule_id', scheduleId)
        .order('actual_start_time', { ascending: true })

      if (error) {
        throw handleError(error)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async getShiftsByEmployee(employeeId: string, startDate?: Date, endDate?: Date) {
    const supabase = createClient()
    try {
      let query = supabase
        .from('individual_shifts')
        .select('*')
        .eq('employee_id', employeeId)

      if (startDate) {
        query = query.gte('actual_start_time', startDate.toISOString())
      }
      if (endDate) {
        query = query.lte('actual_end_time', endDate.toISOString())
      }

      const { data, error } = await query.order('actual_start_time', { ascending: true })

      if (error) {
        throw handleError(error)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async getShiftCounts(startDate: Date, endDate: Date) {
    const supabase = createClient()
    try {
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
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async searchShifts(options: SearchShiftsOptions = {}) {
    const supabase = createClient()
    try {
      let query = supabase
        .from('individual_shifts')
        .select('*, employees (id, first_name, last_name)')

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

      if (error) {
        throw handleError(error)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  }
} 