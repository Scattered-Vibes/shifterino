'use server'

import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/supabase/database'
import { createClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/utils/error-handler'

type ScheduleInsert = Database['public']['Tables']['schedules']['Insert']
type ScheduleUpdate = Database['public']['Tables']['schedules']['Update']

export async function updateSchedule(
  scheduleId: string,
  updates: ScheduleUpdate
) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('schedules')
      .update(updates)
      .eq('id', scheduleId)
      .select()
      .single()

    if (error) {
      const appError = handleError(error)
      return { error: appError.message, code: appError.code }
    }

    revalidatePath('/manage')
    return { data }
  } catch (error) {
    const appError = handleError(error)
    return { error: appError.message, code: appError.code }
  }
}

export async function createScheduleEntry(scheduleData: ScheduleInsert) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('schedules')
      .insert([scheduleData])
      .select()
      .single()

    if (error) {
      const appError = handleError(error)
      return { error: appError.message, code: appError.code }
    }

    revalidatePath('/manage')
    return { data }
  } catch (error) {
    const appError = handleError(error)
    return { error: appError.message, code: appError.code }
  }
}

export async function deleteSchedule(scheduleId: string) {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId)

    if (error) {
      const appError = handleError(error)
      return { error: appError.message, code: appError.code }
    }

    revalidatePath('/manage')
    return { success: true }
  } catch (error) {
    const appError = handleError(error)
    return { error: appError.message, code: appError.code }
  }
}
