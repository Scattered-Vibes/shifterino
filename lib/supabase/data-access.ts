import { createClient } from './client'
import type { Database } from '@/types/database'
import { handleError } from '@/lib/utils/error-handler'
import type { SupabaseClient } from '@supabase/supabase-js'

type Tables = Database['public']['Tables']
type Employee = Tables['employees']['Row']
type Schedule = Tables['schedules']['Row']
type TimeOffRequest = Tables['time_off_requests']['Row']

interface QueryOptions {
  page?: number
  limit?: number
  search?: {
    column: string
    query: string
  }
}

// Type for Supabase query builder
type GenericQuery = ReturnType<ReturnType<SupabaseClient<Database>['from']>['select']>

const queryBuilder = {
  withPagination: (query: GenericQuery, page = 0, limit = 10) => 
    query.range(page * limit, (page + 1) * limit - 1),
  
  withSearch: (query: GenericQuery, column: string, searchQuery: string) =>
    query.ilike(column, `%${searchQuery}%`),
  
  applyOptions: (query: GenericQuery, options: QueryOptions = {}) => {
    let modifiedQuery = query

    if (options.search) {
      modifiedQuery = queryBuilder.withSearch(
        modifiedQuery, 
        options.search.column, 
        options.search.query
      )
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

export const employeeQueries = {
  async getEmployee(employeeId: string) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          schedules (
            id,
            start_date,
            end_date,
            shift_type,
            status
          )
        `)
        .eq('id', employeeId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async getEmployeeByAuthId(authId: string) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_id', authId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async updateEmployee(employeeId: string, data: Partial<Employee>) {
    try {
      const supabase = createClient()
      const { data: updatedEmployee, error } = await supabase
        .from('employees')
        .update(data)
        .eq('id', employeeId)
        .select()
        .single()

      if (error) throw error
      return { data: updatedEmployee, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async searchEmployees(options?: QueryOptions) {
    try {
      const supabase = createClient()
      const builder = queryBuilder
      
      let query = supabase
        .from('employees')
        .select('*')
        .order('last_name', { ascending: true })

      query = builder.applyOptions(query, options)
      
      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  }
}

export const scheduleQueries = {
  async getSchedules(params: {
    employeeId?: string
    startDate: Date
    endDate: Date
    status?: Schedule['status']
  }) {
    try {
      const supabase = createClient()
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
        .gte('start_date', params.startDate.toISOString())
        .lte('end_date', params.endDate.toISOString())

      if (params.employeeId) {
        query = query.eq('employee_id', params.employeeId)
      }

      if (params.status) {
        query = query.eq('status', params.status)
      }

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async createSchedule(data: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const supabase = createClient()
      const { data: newSchedule, error } = await supabase
        .from('schedules')
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return { data: newSchedule, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async updateSchedule(scheduleId: string, data: Partial<Schedule>) {
    try {
      const supabase = createClient()
      const { data: updatedSchedule, error } = await supabase
        .from('schedules')
        .update(data)
        .eq('id', scheduleId)
        .select()
        .single()

      if (error) throw error
      return { data: updatedSchedule, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  }
}

export const timeOffQueries = {
  async getTimeOffRequests(params: {
    employeeId?: string
    startDate?: Date
    endDate?: Date
    status?: TimeOffRequest['status']
    options?: QueryOptions
  }) {
    try {
      const supabase = createClient()
      const builder = queryBuilder
      
      let query = supabase
        .from('time_off_requests')
        .select(`
          *,
          employee:employees (
            id,
            first_name,
            last_name
          )
        `)
        .order('start_date', { ascending: true })

      if (params.employeeId) {
        query = query.eq('employee_id', params.employeeId)
      }

      if (params.startDate) {
        query = query.gte('start_date', params.startDate.toISOString())
      }

      if (params.endDate) {
        query = query.lte('end_date', params.endDate.toISOString())
      }

      if (params.status) {
        query = query.eq('status', params.status)
      }

      query = builder.applyOptions(query, params.options)

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async createTimeOffRequest(data: Omit<TimeOffRequest, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const supabase = createClient()
      const { data: newRequest, error } = await supabase
        .from('time_off_requests')
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return { data: newRequest, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async updateTimeOffRequest(requestId: string, data: Partial<TimeOffRequest>) {
    try {
      const supabase = createClient()
      const { data: updatedRequest, error } = await supabase
        .from('time_off_requests')
        .update(data)
        .eq('id', requestId)
        .select()
        .single()

      if (error) throw error
      return { data: updatedRequest, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  }
} 