/**
 * Regular Supabase operations that don't require service role access.
 * These operations use the standard client with RLS policies.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'
import type {
  IndividualShiftWithDetails,
  ShiftUpdateData,
  ShiftSwapRequestWithDetails,
  ShiftSwapRequestCreate,
  ShiftSwapRequestUpdate,
  Employee
} from '@/types/models/shift'
import type {
  TimeOffRequestWithDetails,
  TimeOffRequestCreate,
  TimeOffRequestUpdate
} from '@/types/models/time-off'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// Shifts
export async function getShifts() {
  const { data, error } = await supabase
    .from('individual_shifts')
    .select(`
      *,
      employee:employees!employee_id(id, first_name, last_name, email, role),
      shift_option:shift_options!shift_option_id(*)
    `)
    .order('start_time', { ascending: true })

  if (error) throw error
  return data as unknown as IndividualShiftWithDetails[]
}

export async function getShiftById(id: string) {
  const { data, error } = await supabase
    .from('individual_shifts')
    .select(`
      *,
      employee:employees!employee_id(id, first_name, last_name, email, role),
      shift_option:shift_options!shift_option_id(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as unknown as IndividualShiftWithDetails
}

export async function updateShift(id: string, updateData: ShiftUpdateData) {
  const { error } = await supabase
    .from('individual_shifts')
    .update(updateData)
    .eq('id', id)

  if (error) throw error
}

// Shift Swaps
export async function getShiftSwapRequests() {
  const { data, error } = await supabase
    .from('shift_swap_requests')
    .select(`
      *,
      requesting_employee:employees!requesting_employee_id(id, first_name, last_name, email, role),
      receiving_employee:employees!receiving_employee_id(id, first_name, last_name, email, role),
      requesting_shift:individual_shifts!requesting_shift_id(*,
        employee:employees!employee_id(id, first_name, last_name, email, role),
        shift_option:shift_options!shift_option_id(*)
      ),
      receiving_shift:individual_shifts!receiving_shift_id(*,
        employee:employees!employee_id(id, first_name, last_name, email, role),
        shift_option:shift_options!shift_option_id(*)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as unknown as ShiftSwapRequestWithDetails[]
}

export async function createShiftSwapRequest(data: ShiftSwapRequestCreate) {
  const { error } = await supabase
    .from('shift_swap_requests')
    .insert({
      requesting_employee_id: data.requesting_employee_id,
      receiving_employee_id: data.receiving_employee_id,
      requesting_shift_id: data.requesting_shift_id,
      receiving_shift_id: data.receiving_shift_id,
      status: data.status || 'pending',
      notes: data.notes
    })

  if (error) throw error
}

export async function updateShiftSwapRequest(
  id: string,
  data: ShiftSwapRequestUpdate
) {
  const { error } = await supabase
    .from('shift_swap_requests')
    .update({
      status: data.status,
      approved_rejected_at: new Date().toISOString(),
      approved_rejected_by: data.approved_rejected_by,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
}

// Time Off
export async function getTimeOffRequests() {
  const { data, error } = await supabase
    .from('time_off_requests')
    .select(`
      *,
      employee:employees!employee_id(id, first_name, last_name, email, role)
    `)
    .order('start_date', { ascending: true })

  if (error) throw error
  return data as unknown as TimeOffRequestWithDetails[]
}

export async function createTimeOffRequest(data: TimeOffRequestCreate) {
  const { error } = await supabase
    .from('time_off_requests')
    .insert({
      employee_id: data.employee_id,
      start_date: data.start_date,
      end_date: data.end_date,
      reason: data.reason,
      notes: data.notes,
      status: data.status || 'pending'
    })

  if (error) throw error
}

export async function updateTimeOffRequest(
  id: string,
  data: TimeOffRequestUpdate
) {
  const { error } = await supabase
    .from('time_off_requests')
    .update({
      status: data.status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
}

// Employees
export async function getEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name, email, role')
    .order('last_name', { ascending: true })

  if (error) throw error
  return data as Employee[]
}

export async function getEmployeeById(id: string) {
  const { data, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name, email, role')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Employee
}

export async function updateEmployee(id: string, data: Partial<Employee>) {
  const { error } = await supabase
    .from('employees')
    .update(data)
    .eq('id', id)

  if (error) throw error
} 