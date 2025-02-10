import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import { handleError } from '@/lib/utils/error-handler'
import type { SupabaseClient } from '@supabase/supabase-js'

type ShiftType = 'ten_hour' | 'twelve_hour' | 'four_hour'
type ScheduleStatus = 'draft' | 'published' | 'archived'
type ShiftPattern = 'pattern_a' | 'pattern_b' | 'custom'

interface QueryOptions {
  page?: number
  limit?: number
  search?: {
    column: string
    query: string
  }
  startDate?: Date
  endDate?: Date
  status?: ScheduleStatus
}

interface CreateScheduleData {
  employee_id: string
  start_date: string
  end_date: string
  shift_type: ShiftType
  shift_pattern: ShiftPattern
  status: ScheduleStatus
  is_supervisor?: boolean
  notes?: string
  created_by: string
  updated_by: string
}

interface UpdateScheduleData extends Partial<Omit<CreateScheduleData, 'created_by'>> {
  updated_by: string
}

// Type for Supabase query builder
type GenericQuery = ReturnType<ReturnType<SupabaseClient<Database>['from']>['select']>

const queryBuilder = {
  withPagination: (query: GenericQuery, page = 0, limit = 10) => 
    query.range(page * limit, (page + 1) * limit - 1),
  
  withSearch: (query: GenericQuery, column: string, searchQuery: string) =>
    query.ilike(column, `%${searchQuery}%`),
  
  withDateRange: (query: GenericQuery, startDate?: Date, endDate?: Date) => {
    let modifiedQuery = query
    
    if (startDate) {
      modifiedQuery = modifiedQuery.gte('start_date', startDate.toISOString())
    }
    if (endDate) {
      modifiedQuery = modifiedQuery.lte('end_date', endDate.toISOString())
    }
    
    return modifiedQuery
  },
  
  applyOptions: (query: GenericQuery, options: QueryOptions = {}) => {
    let modifiedQuery = query

    if (options.search) {
      modifiedQuery = queryBuilder.withSearch(
        modifiedQuery, 
        options.search.column, 
        options.search.query
      )
    }

    if (options.startDate || options.endDate) {
      modifiedQuery = queryBuilder.withDateRange(
        modifiedQuery,
        options.startDate,
        options.endDate
      )
    }

    if (options.status) {
      modifiedQuery = modifiedQuery.eq('status', options.status)
    }

    if (typeof options.page === 'number' && typeof options.limit === 'number') {
      modifiedQuery = queryBuilder.withPagination(
        modifiedQuery,
        options.page,
        options.limit
      )
    }

    return modifiedQuery
  }
}

export const scheduleQueries = {
  async getSchedule(scheduleId: string) {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          employee:employees (
            id,
            first_name,
            last_name,
            role
          ),
          individual_shifts (
            id,
            actual_start_time,
            actual_end_time,
            status
          )
        `)
        .eq('id', scheduleId)
        .single()

      if (error) {
        throw handleError(error)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async createSchedule(data: CreateScheduleData) {
    const supabase = createClient()
    try {
      const { data: newSchedule, error } = await supabase
        .from('schedules')
        .insert(data)
        .select()
        .single()

      if (error) {
        throw handleError(error)
      }

      return { data: newSchedule, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async updateSchedule(scheduleId: string, data: UpdateScheduleData) {
    const supabase = createClient()
    try {
      const { data: updatedSchedule, error } = await supabase
        .from('schedules')
        .update(data)
        .eq('id', scheduleId)
        .select()
        .single()

      if (error) {
        throw handleError(error)
      }

      return { data: updatedSchedule, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async deleteSchedule(scheduleId: string) {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId)

      if (error) {
        throw handleError(error)
      }

      return { data: true, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async searchSchedules(options?: QueryOptions) {
    const supabase = createClient()
    try {
      const builder = queryBuilder
      
      let query = supabase
        .from('schedules')
        .select(`
          *,
          employee:employees (
            id,
            first_name,
            last_name,
            role
          )
        `)
        .order('start_date', { ascending: true })

      query = builder.applyOptions(query, options)
      
      const { data, error } = await query

      if (error) {
        throw handleError(error)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async getScheduleShifts(scheduleId: string) {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('individual_shifts')
        .select('*')
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

  async getScheduleConflicts(employeeId: string, startDate: Date, endDate: Date) {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', employeeId)
        .or(`start_date.lte.${endDate.toISOString()},end_date.gte.${startDate.toISOString()}`)

      if (error) {
        throw handleError(error)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  }
} 