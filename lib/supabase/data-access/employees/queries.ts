import { supabase } from '@/lib/supabase/client'
import type { 
  Employee, 
  EmployeeWithShifts, 
  EmployeeUpdateData,
  GetEmployeesOptions,
  EmployeeAvailability 
} from './types'

// Get all employees with optional filters
export async function getEmployees(options: GetEmployeesOptions = {}): Promise<Employee[]> {
  let query = supabase
    .from('employees')
    .select(
      options.includeShifts
        ? `*, individual_shifts(*)`
        : options.includeTimeOffRequests
        ? `*, time_off_requests(*)`
        : '*'
    )

  if (options.isActive !== undefined) {
    query = query.eq('is_active', options.isActive)
  }

  if (options.role) {
    query = query.eq('role', options.role)
  }

  if (options.searchTerm) {
    query = query.or(
      `first_name.ilike.%${options.searchTerm}%,last_name.ilike.%${options.searchTerm}%,email.ilike.%${options.searchTerm}%`
    )
  }

  const { data, error } = await query.order('last_name', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as Employee[]
}

// Get a single employee by ID
export async function getEmployeeById(id: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Get an employee with their shifts
export async function getEmployeeWithShifts(id: string): Promise<EmployeeWithShifts | null> {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      individual_shifts(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as unknown as EmployeeWithShifts
}

// Update an employee
export async function updateEmployee(id: string, updateData: EmployeeUpdateData): Promise<void> {
  const { error } = await supabase
    .from('employees')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
}

// Create a new employee
export async function createEmployee(
  data: Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'auth_id'>
): Promise<Employee> {
  const { data: newEmployee, error } = await supabase
    .from('employees')
    .insert({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return newEmployee
}

// Deactivate an employee (soft delete)
export async function deactivateEmployee(id: string): Promise<void> {
  const { error } = await supabase
    .from('employees')
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
}

// Get employee availability for a date range
export async function getEmployeeAvailability(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<EmployeeAvailability[]> {
  // First get any time off requests
  const { data: timeOffRequests, error: timeOffError } = await supabase
    .from('time_off_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'approved')
    .gte('start_date', startDate)
    .lte('end_date', endDate)

  if (timeOffError) throw timeOffError

  // Then get any shifts
  const { data: shifts, error: shiftsError } = await supabase
    .from('individual_shifts')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('actual_start_time', startDate)
    .lte('actual_end_time', endDate)

  if (shiftsError) throw shiftsError

  // Combine into availability records
  const availability: EmployeeAvailability[] = []

  // Add time off periods
  timeOffRequests?.forEach(request => {
    availability.push({
      employee_id: employeeId,
      start_date: request.start_date,
      end_date: request.end_date,
      is_available: false,
      reason: 'Time Off Request'
    })
  })

  // Add shift periods
  shifts?.forEach(shift => {
    if (shift.actual_start_time && shift.actual_end_time) {
      availability.push({
        employee_id: employeeId,
        start_date: shift.actual_start_time,
        end_date: shift.actual_end_time,
        is_available: false,
        reason: 'Scheduled Shift'
      })
    }
  })

  return availability
}

// Get employees available for a shift
export async function getAvailableEmployees(
  startTime: string,
  endTime: string
): Promise<Employee[]> {
  // Get all active employees
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('*')
    .eq('is_active', true)

  if (employeesError) throw employeesError
  if (!employees) return []

  // Get conflicting shifts
  const { data: conflicts, error: conflictsError } = await supabase
    .from('individual_shifts')
    .select('employee_id')
    .gte('actual_start_time', startTime)
    .lte('actual_end_time', endTime)

  if (conflictsError) throw conflictsError

  // Get conflicting time off requests
  const { data: timeOff, error: timeOffError } = await supabase
    .from('time_off_requests')
    .select('employee_id')
    .eq('status', 'approved')
    .gte('start_date', startTime)
    .lte('end_date', endTime)

  if (timeOffError) throw timeOffError

  // Filter out employees with conflicts
  const unavailableIds = new Set([
    ...(conflicts?.map(c => c.employee_id) || []),
    ...(timeOff?.map(t => t.employee_id) || [])
  ])

  return employees.filter(emp => !unavailableIds.has(emp.id))
}