'use server'

import { getServerClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/utils/error-handler'
import { requireAuth, requireSupervisor as requireSupervisorOrAbove, verifyEmployeeAccess } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const timeOffRequestSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(1).max(500),
  type: z.enum(['VACATION', 'SICK', 'PERSONAL', 'OTHER'])
})

export async function createTimeOffRequest(data: z.infer<typeof timeOffRequestSchema>) {
  try {
    // Verify authenticated
    const auth = await requireAuth()
    
    // Validate request data
    const validated = timeOffRequestSchema.parse(data)
    
    const supabase = getServerClient()
    
    // Create request
    const { data: request, error } = await supabase
      .from('time_off_requests')
      .insert({
        employee_id: auth.employee_id,
        start_date: validated.start_date,
        end_date: validated.end_date,
        reason: validated.reason,
        type: validated.type,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/time-off')
    return request
  } catch (error) {
    throw handleError(error)
  }
}

export async function updateTimeOffRequest(
  requestId: string,
  data: Partial<z.infer<typeof timeOffRequestSchema>>
) {
  try {
    // Verify authenticated
    const auth = await requireSupervisorOrAbove()
    
    const supabase = getServerClient()
    
    // Get request to verify ownership
    const { data: request, error: fetchError } = await supabase
      .from('time_off_requests')
      .select('employee_id, status')
      .eq('id', requestId)
      .single()
      
    if (fetchError) throw fetchError
    if (!request) throw new Error('Request not found')
    
    // Only allow updates to pending requests by the owner
    if (request.employee_id !== auth.employee_id) {
      throw new Error('Not authorized to update this request')
    }
    
    if (request.status !== 'pending') {
      throw new Error('Can only update pending requests')
    }
    
    // Validate partial data
    const validated = timeOffRequestSchema.partial().parse(data)
    
    // Update request
    const { data: updatedRequest, error } = await supabase
      .from('time_off_requests')
      .update(validated)
      .eq('id', requestId)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/time-off')
    return updatedRequest
  } catch (error) {
    throw handleError(error)
  }
}

export async function deleteTimeOffRequest(requestId: string) {
  try {
    // Verify authenticated
    const auth = await requireAuth()
    
    const supabase = getServerClient()
    
    // Get request to verify ownership
    const { data: request, error: fetchError } = await supabase
      .from('time_off_requests')
      .select('employee_id, status')
      .eq('id', requestId)
      .single()
      
    if (fetchError) throw fetchError
    if (!request) throw new Error('Request not found')
    
    // Only allow deletion of pending requests by the owner
    if (request.employee_id !== auth.employee_id) {
      throw new Error('Not authorized to delete this request')
    }
    
    if (request.status !== 'pending') {
      throw new Error('Can only delete pending requests')
    }
    
    // Delete request
    const { error } = await supabase
      .from('time_off_requests')
      .delete()
      .eq('id', requestId)
    
    if (error) throw error
    
    revalidatePath('/time-off')
    return { success: true }
  } catch (error) {
    throw handleError(error)
  }
}

export async function approveTimeOffRequest(requestId: string) {
  try {
    // Verify supervisor or above
    const auth = await requireSupervisorOrAbove()
    
    const supabase = getServerClient()
    
    // Get request to verify team access
    const { data: request, error: fetchError } = await supabase
      .from('time_off_requests')
      .select('employee_id, status')
      .eq('id', requestId)
      .single()
      
    if (fetchError) throw fetchError
    if (!request) throw new Error('Request not found')
    
    // Verify access to employee
    await verifyEmployeeAccess(auth, request.employee_id)
    
    if (request.status !== 'pending') {
      throw new Error('Can only approve pending requests')
    }
    
    // Update request status
    const { data: updatedRequest, error } = await supabase
      .from('time_off_requests')
      .update({ status: 'approved' })
      .eq('id', requestId)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/time-off')
    return updatedRequest
  } catch (error) {
    throw handleError(error)
  }
}

export async function rejectTimeOffRequest(requestId: string, reason: string) {
  try {
    // Verify supervisor or above
    const auth = await requireSupervisorOrAbove()
    
    const supabase = getServerClient()
    
    // Get request to verify team access
    const { data: request, error: fetchError } = await supabase
      .from('time_off_requests')
      .select('employee_id, status')
      .eq('id', requestId)
      .single()
      
    if (fetchError) throw fetchError
    if (!request) throw new Error('Request not found')
    
    // Verify access to employee
    await verifyEmployeeAccess(auth, request.employee_id)
    
    if (request.status !== 'pending') {
      throw new Error('Can only reject pending requests')
    }
    
    // Update request status
    const { data: updatedRequest, error } = await supabase
      .from('time_off_requests')
      .update({
        status: 'rejected',
        notes: reason
      })
      .eq('id', requestId)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/time-off')
    return updatedRequest
  } catch (error) {
    throw handleError(error)
  }
}
