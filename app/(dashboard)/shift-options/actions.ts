'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/lib/supabase/server'
import { handleError, ErrorCode } from '@/lib/utils/error-handler'
import type { Database } from '@/types/supabase/database'
import { differenceInHours, parse } from 'date-fns'

interface CreateShiftOptionData {
  name: string
  category: 'early' | 'day' | 'swing' | 'graveyard'
  start_time: string
  end_time: string
}

export async function createShiftOption(data: CreateShiftOptionData) {
  try {
    const supabase = getServerClient()

    // Calculate duration
    const startTime = parse(data.start_time, 'HH:mm', new Date())
    const endTime = parse(data.end_time, 'HH:mm', new Date())
    const duration = differenceInHours(endTime, startTime)

    if (duration <= 0) {
      return {
        error: 'End time must be after start time',
        field: 'end_time',
      }
    }

    // Check for overlapping shift options
    const { data: existing, error: checkError } = await supabase
      .from('shift_options')
      .select('*')
      .or(
        `and(start_time,lte,${data.end_time},end_time,gte,${data.start_time})`
      )
      .eq('category', data.category)

    if (checkError) throw checkError

    if (existing && existing.length > 0) {
      return {
        error: 'A shift option already exists in this time range',
      }
    }

    const { error: insertError } = await supabase.from('shift_options').insert({
      name: data.name,
      category: data.category,
      start_time: data.start_time,
      end_time: data.end_time,
      duration_hours: duration,
    })

    if (insertError) throw insertError

    revalidatePath('/shift-options')
    return { success: true }
  } catch (error) {
    console.error('Error creating shift option:', error)
    return {
      error: 'Failed to create shift option. Please try again.',
    }
  }
}

export async function getShiftOptions() {
  const supabase = getServerClient()
  const { data, error } = await supabase
    .from('shift_options')
    .select('*')
    .order('start_time')

  if (error) {
    throw handleError(error, ErrorCode.DATABASE_ERROR)
  }

  return data
} 