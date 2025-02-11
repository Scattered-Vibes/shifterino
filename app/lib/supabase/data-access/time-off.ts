import { createClient } from '@/app/lib/supabase/client'
import type { Database } from '@/types/supabase/database'
import { handleError } from '@/app/lib/utils/error-handler'
import type { SupabaseClient } from '@supabase/supabase-js'

type TimeOffStatus = 'pending' | 'approved' | 'rejected'
type DatabaseTables = Database['public']['Tables']
type TimeOffRequest = DatabaseTables['time_off_requests']['Row']

const supabase = createClient()

export async function getTimeOffRequests() {
  try {
    const { data, error } = await supabase
      .from('time_off_requests')
      .select(`
        *,
        employee:employees(*),
        reviewer:employees(*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as TimeOffRequest[]
  } catch (error) {
    handleError(error)
    return []
  }
}

export async function getTimeOffRequest(id: string) {
  try {
    const { data, error } = await supabase
      .from('time_off_requests')
      .select(`
        *,
        employee:employees(*),
        reviewer:employees(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as TimeOffRequest
  } catch (error) {
    handleError(error)
    return null
  }
}

export async function createTimeOffRequest(request: Omit<TimeOffRequest, 'id' | 'status' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('time_off_requests')
      .insert([{ ...request, status: 'pending' }])
      .select()
      .single()

    if (error) throw error
    return data as TimeOffRequest
  } catch (error) {
    handleError(error)
    return null
  }
}

export async function updateTimeOffRequest(id: string, request: Partial<TimeOffRequest>) {
  try {
    const { data, error } = await supabase
      .from('time_off_requests')
      .update(request)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as TimeOffRequest
  } catch (error) {
    handleError(error)
    return null
  }
}

export async function deleteTimeOffRequest(id: string) {
  try {
    const { error } = await supabase
      .from('time_off_requests')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    handleError(error)
    return false
  }
}

export async function reviewTimeOffRequest(id: string, status: string, reviewerId: string) {
  try {
    const { data, error } = await supabase
      .from('time_off_requests')
      .update({
        status,
        reviewer_id: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as TimeOffRequest
  } catch (error) {
    handleError(error)
    return null
  }
}

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