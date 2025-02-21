import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/index'
import { handleError } from '@/lib/utils/error-handler'

export const timeOffSchema = z.object({
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
})

export type TimeOffFormValues = z.infer<typeof timeOffSchema>

'use server'
export async function submitTimeOff(data: TimeOffFormValues) {
  try {
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('You must be logged in to submit a request.')
    }

    // Get employee record
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (employeeError || !employee) {
      throw new Error('Employee record not found.')
    }

    // Submit request
    const { error: insertError } = await supabase
      .from('time_off_requests')
      .insert({
        employee_id: employee.id,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason,
        notes: data.notes || null,
        status: 'pending',
      })

    if (insertError) throw insertError

    revalidatePath('/time-off')
    return { success: true }
  } catch (error) {
    throw handleError(error)
  }
}

'use server'
export async function updateTimeOffStatus(id: string, status: 'approved' | 'rejected') {
  try {
    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('time_off_requests')
      .update({ status })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/time-off')
    return { success: true }
  } catch (error) {
    throw handleError(error)
  }
} 