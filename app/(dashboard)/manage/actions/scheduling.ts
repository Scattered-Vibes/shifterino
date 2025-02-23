'use server'

import { getServerClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/utils/error-handler'
import { requireManager, requireSupervisor as requireSupervisorOrAbove, verifyTeamAccess } from '@/lib/auth/server'
import type { Database } from '@/types/supabase/database'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

type Schedule = Database['public']['Tables']['schedules']['Row']
type ScheduleInsert = Database['public']['Tables']['schedules']['Insert']
type ScheduleUpdate = Database['public']['Tables']['schedules']['Update']
type IndividualShift = Database['public']['Tables']['individual_shifts']['Row']
type IndividualShiftInsert = Database['public']['Tables']['individual_shifts']['Insert']
type IndividualShiftUpdate = Database['public']['Tables']['individual_shifts']['Update']

const scheduleIdSchema = z.string().uuid()

export async function createSchedule(data: Omit<ScheduleInsert, 'id' | 'created_at' | 'updated_at'>) {
  try {
    // Verify manager role
    await requireManager()
    
    const supabase = getServerClient()
    
    const { error } = await supabase
      .from('schedules')
      .insert(data)
    
    if (error) throw error
    
    revalidatePath('/schedule')
    return { success: true }
  } catch (error) {
    throw handleError(error)
  }
}

export async function updateIndividualShift(shiftId: string, data: Partial<IndividualShiftUpdate>) {
  try {
    // Verify supervisor or above
    const auth = await requireSupervisorOrAbove()
    
    const supabase = getServerClient()
    
    // Get shift to verify team access
    const { data: shift, error: fetchError } = await supabase
      .from('individual_shifts')
      .select('employee_id')
      .eq('id', shiftId)
      .single()
      
    if (fetchError) throw fetchError
    if (!shift) throw new Error('Shift not found')
    
    // Verify team access
    await verifyTeamAccess(auth, shift.employee_id)
    
    // Update shift
    const { error } = await supabase
      .from('individual_shifts')
      .update(data)
      .eq('id', shiftId)
    
    if (error) throw error
    
    revalidatePath('/schedule')
    return { success: true }
  } catch (error) {
    throw handleError(error)
  }
}

export async function deleteIndividualShift(shiftId: string) {
  try {
    // Verify manager role
    await requireManager()
    
    const supabase = getServerClient()
    
    const { error } = await supabase
      .from('individual_shifts')
      .delete()
      .eq('id', shiftId)
    
    if (error) throw error
    
    revalidatePath('/schedule')
    return { success: true }
  } catch (error) {
    throw handleError(error)
  }
}

export async function generateSchedule(
  scheduleId: string,
  params: {
    startDate: string
    endDate: string
    organizationId: string
  }
): Promise<{ success: boolean }> {
  try {
    // Verify manager role
    await requireManager()
    
    const supabase = getServerClient()
    
    // Validate schedule exists
    const parsedId = scheduleIdSchema.parse(scheduleId)
    
    // Create schedule if it doesn't exist
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .upsert({
        id: parsedId,
        organization_id: params.organizationId,
        name: `Schedule ${new Date(params.startDate).toLocaleDateString()}`,
        start_date: params.startDate,
        end_date: params.endDate,
        is_published: false
      })
      .select()
      .single()
    
    if (scheduleError) throw scheduleError
    
    revalidatePath('/schedule')
    return { success: true }
  } catch (error) {
    throw handleError(error)
  }
}

export async function publishSchedule(scheduleId: string) {
  try {
    // Verify manager role
    await requireManager()
    
    const supabase = getServerClient()
    
    // Update schedule to published
    const { error } = await supabase
      .from('schedules')
      .update({ is_published: true })
      .eq('id', scheduleId)
    
    if (error) throw error
    
    revalidatePath('/schedule')
    return { success: true }
  } catch (error) {
    throw handleError(error)
  }
} 