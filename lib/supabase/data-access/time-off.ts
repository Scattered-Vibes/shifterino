import { createClient } from '@/lib/supabase/client'
import type { TimeOffRequest, TimeOffStatus } from '@/types'
import { handleError } from '@/lib/utils/error-handler'

const supabase = createClient()

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

export async function getTimeOffRequests(options?: QueryOptions) {
  try {
    let query = supabase
      .from('time_off_requests')
      .select(`
        *,
        employee:employees(*),
        reviewer:employees(*)
      `)

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.employeeId) {
      query = query.eq('employee_id', options.employeeId)
    }

    if (options?.startDate) {
      query = query.gte('start_date', options.startDate.toISOString())
    }

    if (options?.endDate) {
      query = query.lte('end_date', options.endDate.toISOString())
    }

    if (typeof options?.page === 'number' && typeof options?.limit === 'number') {
      const start = options.page * options.limit
      const end = start + options.limit - 1
      query = query.range(start, end)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

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
      .insert([{ ...request, status: 'pending' as const }])
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

export async function reviewTimeOffRequest(id: string, status: TimeOffStatus, reviewerId: string) {
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

export const timeOffQueries = {
  async searchTimeOffRequests(options?: QueryOptions) {
    try {
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

      if (options?.status) {
        query = query.eq('status', options.status)
      }

      if (options?.employeeId) {
        query = query.eq('employee_id', options.employeeId)
      }

      if (options?.startDate) {
        query = query.gte('start_date', options.startDate.toISOString())
      }

      if (options?.endDate) {
        query = query.lte('end_date', options.endDate.toISOString())
      }

      if (typeof options?.page === 'number' && typeof options?.limit === 'number') {
        const start = options.page * options.limit
        const end = start + options.limit - 1
        query = query.range(start, end)
      }

      query = query.order('start_date', { ascending: true })
      
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