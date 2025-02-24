import { supabase } from '@/lib/supabase/client'
import type { 
  ShiftSwapRequest,
  ShiftSwapRequestWithDetails,
  ShiftSwapUpdateData,
  GetShiftSwapRequestsOptions
} from './types'

// Get all shift swap requests with optional filters
export async function getShiftSwapRequests(
  options: GetShiftSwapRequestsOptions = {}
): Promise<ShiftSwapRequestWithDetails[]> {
  let query = supabase
    .from('shift_swap_requests')
    .select(
      options.includeDetails
        ? `
          *,
          requesting_employee:employees!requesting_employee_id(*),
          receiving_employee:employees!receiving_employee_id(*),
          shift:individual_shifts!shift_id(*)
        `
        : '*'
    )

  if (options.requestingEmployeeId) {
    query = query.eq('requesting_employee_id', options.requestingEmployeeId)
  }

  if (options.receivingEmployeeId) {
    query = query.eq('receiving_employee_id', options.receivingEmployeeId)
  }

  if (options.status) {
    query = query.eq('status', options.status)
  }

  if (options.startDate) {
    query = query.gte('created_at', options.startDate)
  }

  if (options.endDate) {
    query = query.lte('created_at', options.endDate)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as ShiftSwapRequestWithDetails[]
}

// Get a single shift swap request by ID
export async function getShiftSwapRequestById(
  id: string
): Promise<ShiftSwapRequestWithDetails | null> {
  const { data, error } = await supabase
    .from('shift_swap_requests')
    .select(`
      *,
      requesting_employee:employees!requesting_employee_id(*),
      receiving_employee:employees!receiving_employee_id(*),
      shift:individual_shifts!shift_id(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as unknown as ShiftSwapRequestWithDetails
}

// Create a new shift swap request
export async function createShiftSwapRequest(
  data: Omit<ShiftSwapRequest, 'id' | 'created_at' | 'updated_at' | 'status'>
): Promise<ShiftSwapRequest> {
  const { data: newRequest, error } = await supabase
    .from('shift_swap_requests')
    .insert({
      ...data,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return newRequest
}

// Update a shift swap request
export async function updateShiftSwapRequest(
  id: string,
  updateData: ShiftSwapUpdateData
): Promise<void> {
  const { error } = await supabase
    .from('shift_swap_requests')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
}

// Delete a shift swap request
export async function deleteShiftSwapRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from('shift_swap_requests')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Approve a shift swap request
export async function approveShiftSwapRequest(id: string): Promise<void> {
  const { data: request, error: fetchError } = await supabase
    .from('shift_swap_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError
  if (!request) throw new Error('Shift swap request not found')
  if (!request.proposed_shift_id) throw new Error('No proposed shift found')
  if (!request.receiving_employee_id) throw new Error('No receiving employee found')

  // Update the request status
  const { error: updateError } = await supabase
    .from('shift_swap_requests')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (updateError) throw updateError

  // Update the shift's employee_id
  const { error: shiftError } = await supabase
    .from('individual_shifts')
    .update({
      employee_id: request.receiving_employee_id,
      updated_at: new Date().toISOString()
    })
    .eq('id', request.proposed_shift_id)

  if (shiftError) throw shiftError
}

// Reject a shift swap request
export async function rejectShiftSwapRequest(
  id: string,
  reason?: string
): Promise<void> {
  const { error } = await supabase
    .from('shift_swap_requests')
    .update({
      status: 'rejected',
      notes: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
}

// Get pending shift swap requests for an employee
export async function getPendingShiftSwapRequests(
  employeeId: string
): Promise<ShiftSwapRequestWithDetails[]> {
  const { data, error } = await supabase
    .from('shift_swap_requests')
    .select(`
      *,
      requesting_employee:employees!requesting_employee_id(*),
      receiving_employee:employees!receiving_employee_id(*),
      shift:individual_shifts!shift_id(*)
    `)
    .eq('status', 'pending')
    .or(`requesting_employee_id.eq.${employeeId},receiving_employee_id.eq.${employeeId}`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as ShiftSwapRequestWithDetails[]
} 