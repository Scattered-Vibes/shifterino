'use server'

import { revalidatePath } from 'next/cache'

import type { Database } from '@/types/database'
import { createClient } from '@/lib/supabase/server'

type ScheduleInsert = Database['public']['Tables']['schedules']['Insert']
type ScheduleUpdate = Database['public']['Tables']['schedules']['Update']

export async function updateSchedule(
  scheduleId: string,
  updates: ScheduleUpdate
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('schedules')
    .update(updates)
    .eq('id', scheduleId)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/manage')
  return data
}

export async function createScheduleEntry(scheduleData: ScheduleInsert) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('schedules')
    .insert([scheduleData])
    .select()
    .single()

  if (error) throw error

  revalidatePath('/manage')
  return data
}

export async function deleteSchedule(scheduleId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', scheduleId)

  if (error) throw error

  revalidatePath('/manage')
  return true
}
