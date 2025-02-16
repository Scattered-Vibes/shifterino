import { createServerSupabaseClient } from '@/lib/supabase/server'
import { employeeQueries } from '@/lib/supabase/data-access/employees'
import type { Database } from '@/types/supabase/database'

type Employee = Database['public']['Tables']['employees']['Row']

interface UseEmployeesOptions {
  page?: number
  limit?: number
  search?: {
    column: string
    query: string
  }
}

export async function getEmployees(options: UseEmployeesOptions = {}) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await employeeQueries.searchEmployees(options)
  
  if (error) {
    throw error
  }
  
  return data
}

export async function getEmployee(employeeId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await employeeQueries.getEmployee(employeeId)
  
  if (error) {
    throw error
  }
  
  return data
}

export async function updateEmployee(employeeId: string, data: Partial<Employee>) {
  const supabase = await createServerSupabaseClient()
  const { data: updatedEmployee, error } = await employeeQueries.updateEmployee(employeeId, data)
  
  if (error) {
    throw error
  }
  
  return updatedEmployee
}

export async function getEmployeeSchedules(employeeId: string, startDate?: Date, endDate?: Date) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await employeeQueries.getEmployeeSchedules(employeeId, startDate, endDate)
  
  if (error) {
    throw error
  }
  
  return data
}

export async function getEmployeeShifts(employeeId: string, startDate?: Date, endDate?: Date) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await employeeQueries.getEmployeeShifts(employeeId, startDate, endDate)
  
  if (error) {
    throw error
  }
  
  return data
} 