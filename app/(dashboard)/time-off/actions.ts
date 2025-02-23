'use server'

import { z } from 'zod'
import { getServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Database } from '@/types/supabase/database'
import { handleError, ErrorCode } from '@/lib/utils/error-handler'

type TimeOffRequest = Database['public']['Tables']['time_off_requests']['Row']

const timeOffSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(1).max(500),
  type: z.enum(['VACATION', 'SICK', 'PERSONAL', 'OTHER'])
})

export type TimeOffFormValues = z.infer<typeof timeOffSchema>

export async function submitTimeOff(data: TimeOffFormValues) {
  try {
    const supabase = getServerClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('You must be logged in to submit a request.')
    }

    const { error } = await supabase
      .from('time_off_requests')
      .insert({
        user_id: user.id,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason,
        status: 'PENDING'
      })

    if (error) throw error

    revalidatePath('/time-off')
    redirect('/time-off')
  } catch (error) {
    console.error('Error submitting time off request:', error)
    throw new Error('Failed to submit time off request')
  }
}

export async function updateTimeOffStatus(id: string, status: Database['public']['Enums']['time_off_request_status']) {
  try {
    const supabase = getServerClient()
    const { error } = await supabase
      .from('time_off_requests')
      .update({ status })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/time-off')
  } catch (error) {
    console.error('Error updating time off status:', error)
    throw new Error('Failed to update time off status')
  }
}

export async function getTimeOffRequests() {
  const supabase = getServerClient()
  const { data, error } = await supabase
    .from('time_off_requests')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) {
    throw handleError(error, ErrorCode.DATABASE_ERROR)
  }

  return data
} 