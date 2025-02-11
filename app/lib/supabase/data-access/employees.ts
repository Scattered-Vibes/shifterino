import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase/database'
import { handleError } from '@/lib/utils/error-handler'
import type { SupabaseClient } from '@supabase/supabase-js'

type DatabaseTables = Database['public']['Tables']
type Employee = DatabaseTables['employees']['Row']

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

const supabase = createClient()

export async function getEmployees() {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name')

    if (error) throw error
    return data as Employee[]
  } catch (error) {
    handleError(error)
    return []
  }
}

export async function getEmployee(id: string) {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Employee
  } catch (error) {
    handleError(error)
    return null
  }
}

export async function createEmployee(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('employees')
      .insert([employee])
      .select()
      .single()

    if (error) throw error
    return data as Employee
  } catch (error) {
    handleError(error)
    return null
  }
}

export async function updateEmployee(id: string, employee: Partial<Employee>) {
  try {
    const { data, error } = await supabase
      .from('employees')
      .update(employee)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Employee
  } catch (error) {
    handleError(error)
    return null
  }
}

export async function deleteEmployee(id: string) {
  try {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    handleError(error)
    return false
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