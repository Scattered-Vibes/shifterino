import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import { handleError } from '@/lib/utils/error-handler'
import type { SupabaseClient } from '@supabase/supabase-js'

type TimeOffStatus = 'pending' | 'approved' | 'rejected'

interface QueryOptions {
  page?: number
  limit?: number
  search?: {
    column: string
    query: string
  }
  startDate?: Date
  endDate?: Date
  status?: TimeOffStatus
  employeeId?: string
}

interface CreateTimeOffData {
  employee_id: string
  start_date: string
  end_date: string
  reason: string
  status: TimeOffStatus
  notes?: string
  created_by: string
  updated_by: string
}

interface UpdateTimeOffData extends Partial<Omit<CreateTimeOffData, 'created_by'>> {
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

    if (options.employeeId) {
      modifiedQuery = modifiedQuery.eq('employee_id', options.employeeId)
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

export const timeOffQueries = {
  async getTimeOffRequest(requestId: string) {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('time_off_requests')
        .select(`
          *,
          employee:employees (
            id,
            first_name,
            last_name,
            role
          )
        `)
        .eq('id', requestId)
        .single()

      if (error) {
        throw handleError(error)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async createTimeOffRequest(data: CreateTimeOffData) {
    const supabase = createClient()
    try {
      const { data: newRequest, error } = await supabase
        .from('time_off_requests')
        .insert(data)
        .select()
        .single()

      if (error) {
        throw handleError(error)
      }

      return { data: newRequest, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async updateTimeOffRequest(requestId: string, data: UpdateTimeOffData) {
    const supabase = createClient()
    try {
      const { data: updatedRequest, error } = await supabase
        .from('time_off_requests')
        .update(data)
        .eq('id', requestId)
        .select()
        .single()

      if (error) {
        throw handleError(error)
      }

      return { data: updatedRequest, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async deleteTimeOffRequest(requestId: string) {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('time_off_requests')
        .delete()
        .eq('id', requestId)

      if (error) {
        throw handleError(error)
      }

      return { data: true, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async searchTimeOffRequests(options?: QueryOptions) {
    const supabase = createClient()
    try {
      const builder = queryBuilder
      
      let query = supabase
        .from('time_off_requests')
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

  async getTimeOffConflicts(employeeId: string, startDate: Date, endDate: Date) {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('time_off_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('status', 'approved')
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