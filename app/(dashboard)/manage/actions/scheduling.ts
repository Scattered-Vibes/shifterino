'use server'

import { createClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/utils/error-handler'
import { requireManager, requireSupervisorOrAbove, verifyTeamAccess } from '@/lib/auth/middleware'
import type { IndividualShift } from '@/types/scheduling'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  ScheduleGenerationParams,
  ScheduleGenerationResult
} from '@/types/scheduling'
import { generateSchedule as generateScheduleImpl } from '@/lib/scheduling/generate'

interface SchedulePeriod {
  id?: string
  start_date: string
  end_date: string
  status: 'draft' | 'published' | 'archived'
}

const schedulePeriodIdSchema = z.string().uuid()

export async function createSchedulePeriod(data: Omit<SchedulePeriod, 'id'>) {
  try {
    // Verify manager role
    await requireManager()
    
    const supabase = createClient()
    
    const { error } = await supabase
      .from('schedule_periods')
      .insert(data)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    throw handleError(error)
  }
}

export async function updateSchedule(scheduleId: string, data: Partial<IndividualShift>) {
  try {
    // Verify supervisor or above
    const auth = await requireSupervisorOrAbove()
    
    const supabase = createClient()
    
    // Get schedule to verify team access
    const { data: schedule, error: fetchError } = await supabase
      .from('schedules')
      .select('employee_id')
      .eq('id', scheduleId)
      .single()
      
    if (fetchError) throw fetchError
    if (!schedule) throw new Error('Schedule not found')
    
    // Verify team access
    await verifyTeamAccess(auth, schedule.employee_id)
    
    // Update schedule
    const { error } = await supabase
      .from('schedules')
      .update(data)
      .eq('id', scheduleId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    throw handleError(error)
  }
}

export async function deleteSchedule(scheduleId: string) {
  try {
    // Verify manager role
    await requireManager()
    
    const supabase = createClient()
    
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    throw handleError(error)
  }
}

export async function generateSchedule(
  periodId: string,
  params: ScheduleGenerationParams
): Promise<ScheduleGenerationResult> {
  try {
    // Verify manager role
    await requireManager()
    
    const supabase = createClient()
    
    // Validate period exists
    const parsedId = schedulePeriodIdSchema.parse(periodId)
    
    // Call our new schedule generation implementation
    const result = await generateScheduleImpl(supabase, parsedId, params)
    
    revalidatePath('/schedule')
    return result
  } catch (error) {
    throw handleError(error)
  }
}

export async function publishSchedule(periodId: string) {
  try {
    // Verify manager role
    await requireManager()
    
    const supabase = createClient()
    
    // Update all schedules in period to published
    const { error } = await supabase
      .from('schedules')
      .update({ status: 'published' })
      .eq('period_id', periodId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    throw handleError(error)
  }
} 