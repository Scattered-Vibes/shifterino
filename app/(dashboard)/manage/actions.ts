'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Schedule } from '@/app/_types/database'

export async function updateSchedule(scheduleId: string, updates: Partial<Schedule>) {
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

export async function createScheduleEntry(scheduleData: Partial<Schedule>) {
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