import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'
import { QueryClient } from '@tanstack/react-query'
import { createClient } from '@/app/lib/supabase/client'

type Tables = Database['public']['Tables']
type Schedule = Tables['schedules']['Row']
type Employee = Tables['employees']['Row']
type IndividualShift = Tables['individual_shifts']['Row']

// Initialize Supabase client
const supabase = createClient()

// Generic error type for query errors
export interface QueryError {
  message: string
  status: number
  details?: unknown
}

// Base fetcher function that handles errors
export async function fetcher<T>(
  key: string,
  queryFn: (client: SupabaseClient<Database>) => Promise<{
    data: T[] | null
    error: null | {
      message: string
      code: string
    }
  }>
): Promise<T[]> {
  try {
    const { data, error } = await queryFn(supabase)
    
    if (error) {
      const queryError: QueryError = {
        message: error.message,
        status: parseInt(error.code) || 500,
        details: error
      }
      throw queryError
    }

    if (!data) {
      throw {
        message: 'No data found',
        status: 404
      } as QueryError
    }

    return data
  } catch (error) {
    const queryError = error as QueryError
    console.error(`Query error for ${key}:`, queryError)
    throw queryError
  }
}

// Example query function for fetching schedules
export async function getSchedules(startDate: Date, endDate: Date): Promise<Schedule[]> {
  return fetcher<Schedule>('schedules', async (client) => {
    const query = await client
      .from('schedules')
      .select('*')
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
    return query
  })
}

// Example query function for fetching employees
export async function getEmployees(): Promise<Employee[]> {
  return fetcher<Employee>('employees', async (client) => {
    const query = await client
      .from('employees')
      .select('*')
      .order('last_name', { ascending: true })
    return query
  })
}

// Example query function for fetching shifts
export async function getShifts(scheduleId: string): Promise<IndividualShift[]> {
  return fetcher<IndividualShift>('individual_shifts', async (client) => {
    const query = await client
      .from('individual_shifts')
      .select('*, employee:employees(*)')
      .eq('schedule_id', scheduleId)
    return query
  })
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
}) 