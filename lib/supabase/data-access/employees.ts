import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import { handleError } from '@/lib/utils/error-handler'
import type { SupabaseClient } from '@supabase/supabase-js'

type Tables = Database['public']['Tables']
type Employee = Tables['employees']['Row']

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
    const supabase = createClient()
    try {
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

      if (error) {
        throw handleError(error)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async getEmployeeByAuthId(authId: string) {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_id', authId)
        .single()

      if (error) {
        throw handleError(error)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async updateEmployee(employeeId: string, data: Partial<Employee>) {
    const supabase = createClient()
    try {
      const { data: updatedEmployee, error } = await supabase
        .from('employees')
        .update(data)
        .eq('id', employeeId)
        .select()
        .single()

      if (error) {
        throw handleError(error)
      }

      return { data: updatedEmployee, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async searchEmployees(options?: QueryOptions) {
    const supabase = createClient()
    try {
      const builder = queryBuilder
      
      let query = supabase
        .from('employees')
        .select('*')
        .order('last_name', { ascending: true })

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

  async getEmployeeSchedules(employeeId: string, startDate?: Date, endDate?: Date) {
    const supabase = createClient()
    try {
      let query = supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: true })

      if (startDate) {
        query = query.gte('start_date', startDate.toISOString())
      }
      if (endDate) {
        query = query.lte('end_date', endDate.toISOString())
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

  async getEmployeeShifts(employeeId: string, startDate?: Date, endDate?: Date) {
    const supabase = createClient()
    try {
      let query = supabase
        .from('individual_shifts')
        .select('*')
        .eq('employee_id', employeeId)
        .order('actual_start_time', { ascending: true })

      if (startDate) {
        query = query.gte('actual_start_time', startDate.toISOString())
      }
      if (endDate) {
        query = query.lte('actual_end_time', endDate.toISOString())
      }

      const { data, error } = await query

      if (error) {
        throw handleError(error)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  }
} 