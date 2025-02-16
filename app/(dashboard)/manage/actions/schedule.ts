'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/utils/error-handler'
import { requireSupervisorOrAbove } from '@/lib/auth/middleware'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/supabase/database'

type ShiftStatus = Database['public']['Enums']['shift_status']

export async function updateShift(formData: FormData) {
  try {
    // Verify supervisor or above
    await requireSupervisorOrAbove()
    
    const shiftId = formData.get('shiftId') as string
    const status = formData.get('status') as ShiftStatus
    
    if (!shiftId || !status) {
      throw new Error('Missing required fields')
    }
    
    const supabase = await createServerSupabaseClient()
    
    const { error } = await supabase
      .from('individual_shifts')
      .update({ status })
      .eq('id', shiftId)
    
    if (error) throw error
    
    revalidatePath('/manage/overtime')
    return { success: true }
  } catch (error) {
    return { error: handleError(error) }
  }
}

export async function updateBulkShifts(formData: FormData) {
  try {
    // Verify supervisor or above
    await requireSupervisorOrAbove()
    
    const shiftIds = JSON.parse(formData.get('shiftIds') as string) as string[]
    const status = formData.get('status') as ShiftStatus
    
    if (!shiftIds?.length || !status) {
      throw new Error('Missing required fields')
    }
    
    const supabase = await createServerSupabaseClient()
    
    const { error } = await supabase
      .from('individual_shifts')
      .update({ status })
      .in('id', shiftIds)
    
    if (error) throw error
    
    revalidatePath('/manage/overtime')
    return { success: true }
  } catch (error) {
    return { error: handleError(error) }
  }
} 