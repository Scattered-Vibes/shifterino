import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase/database'
import { getServerClient } from '@/lib/supabase/server'
import { Schedule, ScheduleGenerationParams } from '@/types/models/schedule'
import { IndividualShift } from '@/types/models/shift'
import { StaffingRequirement } from '@/types/models/staffing'
import { TimeOffRequest } from '@/types/models/time-off'
import { handleError, ErrorCode } from '@/lib/utils/error-handler'

type SchedulePeriod = Database['public']['Tables']['schedule_periods']['Row']

interface QueryOptions {
  startDate?: string
  endDate?: string
  isActive?: boolean
}

export async function getSchedules(options: QueryOptions = {}) {
  const supabase = getServerClient()
  const query = supabase
    .from('schedule_periods')
    .select('*')
    
  if (options.startDate) {
    query.gte('start_date', options.startDate)
  }
  
  if (options.endDate) {
    query.lte('end_date', options.endDate)
  }
  
  if (options.isActive !== undefined) {
    query.eq('is_active', options.isActive)
  }
  
  const { data, error } = await query
  
  if (error) {
    throw handleError(error, ErrorCode.DATABASE_ERROR)
  }
  
  return data
}

export async function getSchedule(scheduleId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('schedule_periods')
    .select('*')
    .eq('id', scheduleId)
    .single()
  
  if (error) {
    throw error
  }
  
  return data
}

export async function createSchedule(data: Omit<SchedulePeriod, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createServerSupabaseClient()
  const { data: newSchedule, error } = await supabase
    .from('schedule_periods')
    .insert([data])
    .select()
    .single()
  
  if (error) {
    throw error
  }
  
  return newSchedule
}

export async function updateSchedule(scheduleId: string, data: Partial<Omit<SchedulePeriod, 'id' | 'created_at' | 'updated_at'>>) {
  const supabase = await createServerSupabaseClient()
  const { data: updatedSchedule, error } = await supabase
    .from('schedule_periods')
    .update(data)
    .eq('id', scheduleId)
    .select()
    .single()
  
  if (error) {
    throw error
  }
  
  return updatedSchedule
}

export async function deleteSchedule(scheduleId: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('schedule_periods')
    .delete()
    .eq('id', scheduleId)
  
  if (error) {
    throw error
  }
  
  return true
}

export async function getScheduleShifts(scheduleId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('individual_shifts')
    .select('*, shift_option:shift_options(*)')
    .eq('schedule_period_id', scheduleId)
  
  if (error) {
    throw error
  }
  
  return data
}

export async function getScheduleConflicts(employeeId: string, startDate: Date, endDate: Date) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('individual_shifts')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString())
    .not('status', 'eq', 'cancelled')
  
  if (error) {
    throw error
  }
  
  return data
}

type Tables = Database['public']['Tables'];
type ScheduleRow = Tables['schedules']['Row'];
type IndividualShiftRow = Tables['individual_shifts']['Row'];
type StaffingRequirementRow = Tables['staffing_requirements']['Row'];
type TimeOffRequestRow = Tables['time_off_requests']['Row'];

export async function useSchedules() {
  const supabase = getServerClient();

  async function getSchedule(id: string): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        shifts:individual_shifts(
          *,
          shift_option(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as Schedule;
  }

  async function getEmployeeSchedule(employeeId: string, startDate: string, endDate: string): Promise<IndividualShift[]> {
    const { data, error } = await supabase
      .from('individual_shifts')
      .select(`
        *,
        shift_option(*),
        employee(*)
      `)
      .eq('employee_id', employeeId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;
    return data as unknown as IndividualShift[];
  }

  async function getStaffingRequirements(): Promise<StaffingRequirement[]> {
    const { data, error } = await supabase
      .from('staffing_requirements')
      .select('*')
      .order('start_time');

    if (error) throw error;
    return data as unknown as StaffingRequirement[];
  }

  async function getTimeOffRequests(startDate: string, endDate: string): Promise<TimeOffRequest[]> {
    const { data, error } = await supabase
      .from('time_off_requests')
      .select(`
        *,
        employee(*)
      `)
      .filter('start_date', 'lte', endDate)
      .filter('end_date', 'gte', startDate)
      .in('status', ['pending', 'approved']);

    if (error) throw error;
    return data as unknown as TimeOffRequest[];
  }

  async function generateSchedule(params: ScheduleGenerationParams): Promise<Schedule> {
    const { data, error } = await supabase
      .rpc('generate_schedule', {
        start_date: params.start_date,
        end_date: params.end_date,
        employee_ids: params.employee_ids,
        shift_option_ids: params.shift_option_ids || [],
        respect_time_off: params.respect_time_off,
        respect_weekly_hours: params.respect_weekly_hours,
      });

    if (error) throw error;
    return data as Schedule;
  }

  async function validateSchedule(scheduleId: string) {
    const { data, error } = await supabase
      .rpc('validate_schedule', {
        p_schedule_id: scheduleId,
      });

    if (error) throw error;
    return data as { is_valid: boolean; violations: string[] };
  }

  async function publishSchedule(scheduleId: string): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .update({ is_published: true })
      .eq('id', scheduleId);

    if (error) throw error;
  }

  return {
    getSchedule,
    getEmployeeSchedule,
    getStaffingRequirements,
    getTimeOffRequests,
    generateSchedule,
    validateSchedule,
    publishSchedule,
  };
}