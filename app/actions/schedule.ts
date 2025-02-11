'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { Schedule } from '@/types/scheduling/schedule'
import type { CookieOptions } from '@supabase/ssr'

export async function updateSchedule(schedule: Schedule) {
  try {
    // Validate schedule
    if (!schedule.employeeId || !schedule.shiftId || !schedule.date) {
      return {
        success: false,
        error: 'Missing required fields'
      }
    }

    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data, error } = await supabase
      .from('schedules')
      .update(schedule)
      .eq('id', schedule.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Revalidate the schedules page
    revalidatePath('/schedules')

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Failed to update schedule:', error)
    return {
      success: false,
      error: 'Failed to update schedule'
    }
  }
} 