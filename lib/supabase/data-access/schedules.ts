import { SupabaseClient } from '@supabase/supabase-js'
import { handleError } from '@/lib/utils/error-handler'
import type { Database } from '@/types/supabase/database'

type Tables = Database['public']['Tables']
type IndividualShift = Tables['individual_shifts']['Row']
type SchedulePeriod = Tables['schedule_periods']['Row']

export type CreateScheduleInput = {
  employee_id: string
  date: string
  shift_type: string
  start_time: string
  end_time: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  schedule_period_id: string
}

export type UpdateScheduleInput = Partial<CreateScheduleInput>

export type CreatePeriodInput = {
  name: string
  start_date: string
  end_date: string
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'archived'
  is_published: boolean
  created_by: string
}

export type UpdatePeriodInput = Partial<CreatePeriodInput>

export const scheduleQueries = {
  getScheduleById: async (
    supabase: SupabaseClient<Database>,
    id: string
  ): Promise<IndividualShift> => {
    const { data, error } = await supabase
      .from('individual_shifts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw handleError(error)
    return data
  },

  getSchedulesByPeriod: async (
    supabase: SupabaseClient<Database>,
    periodId: string
  ): Promise<IndividualShift[]> => {
    const { data, error } = await supabase
      .from('individual_shifts')
      .select('*')
      .eq('schedule_period_id', periodId)

    if (error) throw handleError(error)
    return data || []
  },

  getSchedulesByEmployee: async (
    supabase: SupabaseClient<Database>,
    employeeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<IndividualShift[]> => {
    let query = supabase
      .from('individual_shifts')
      .select('*')
      .eq('employee_id', employeeId)

    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)

    const { data, error } = await query
    if (error) throw handleError(error)
    return data || []
  },

  createSchedule: async (
    supabase: SupabaseClient<Database>,
    scheduleData: CreateScheduleInput
  ): Promise<IndividualShift> => {
    const { data, error } = await supabase
      .from('individual_shifts')
      .insert(scheduleData)
      .select()
      .single()

    if (error) throw handleError(error)
    return data
  },

  updateSchedule: async (
    supabase: SupabaseClient<Database>,
    id: string,
    scheduleData: UpdateScheduleInput
  ): Promise<IndividualShift> => {
    const { data, error } = await supabase
      .from('individual_shifts')
      .update(scheduleData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw handleError(error)
    return data
  },

  deleteSchedule: async (
    supabase: SupabaseClient<Database>,
    id: string
  ): Promise<void> => {
    const { error } = await supabase
      .from('individual_shifts')
      .delete()
      .eq('id', id)

    if (error) throw handleError(error)
  },

  createSchedulePeriod: async (
    supabase: SupabaseClient<Database>,
    periodData: CreatePeriodInput
  ): Promise<SchedulePeriod> => {
    const { data, error } = await supabase
      .from('schedule_periods')
      .insert(periodData)
      .select()
      .single()

    if (error) throw handleError(error)
    return data
  },

  updateSchedulePeriodStatus: async (
    supabase: SupabaseClient<Database>,
    periodId: string,
    status: CreatePeriodInput['status']
  ): Promise<void> => {
    const { error } = await supabase
      .from('schedule_periods')
      .update({ status })
      .eq('id', periodId)

    if (error) throw handleError(error)
  }
}
