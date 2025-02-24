import { supabase } from '@/lib/supabase/client'
import type { 
  Schedule,
  ScheduleWithDetails,
  ScheduleUpdateData,
  GetSchedulesOptions,
  StaffingRequirement
} from './types'

// Get all schedules with optional filters
export async function getSchedules(
  options: GetSchedulesOptions = {}
): Promise<ScheduleWithDetails[]> {
  let query = supabase
    .from('schedule_periods')
    .select(
      options.includeShifts
        ? options.includeUsers
          ? `
            *,
            shifts:individual_shifts(*),
            created_by_user:employees!created_by(*),
            updated_by_user:employees!updated_by(*)
          `
          : `*, shifts:individual_shifts(*)`
        : '*'
    )

  if (options.status) {
    query = query.eq('status', options.status)
  }

  if (options.startDate) {
    query = query.gte('start_date', options.startDate)
  }

  if (options.endDate) {
    query = query.lte('end_date', options.endDate)
  }

  const { data, error } = await query.order('start_date', { ascending: false })

  if (error) throw error
  if (!data) return []

  return data.map(schedule => ({
    id: schedule.id,
    name: schedule.description || '',
    description: schedule.description,
    start_date: schedule.start_date,
    end_date: schedule.end_date,
    status: schedule.status as Schedule['status'],
    created_at: schedule.created_at,
    created_by: schedule.created_by,
    updated_at: schedule.updated_at,
    updated_by: schedule.updated_by,
    shifts: [],
    created_by_user: {} as any,
    updated_by_user: {} as any
  }))
}

// Get a single schedule by ID
export async function getScheduleById(
  id: string
): Promise<ScheduleWithDetails | null> {
  const { data, error } = await supabase
    .from('schedule_periods')
    .select(`
      *,
      shifts:individual_shifts(*),
      created_by_user:employees!created_by(*),
      updated_by_user:employees!updated_by(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    name: data.description || '',
    description: data.description,
    start_date: data.start_date,
    end_date: data.end_date,
    status: data.status as Schedule['status'],
    created_at: data.created_at,
    created_by: data.created_by,
    updated_at: data.updated_at,
    updated_by: data.updated_by,
    shifts: data.shifts || [],
    created_by_user: data.created_by_user || {} as any,
    updated_by_user: data.updated_by_user || {} as any
  }
}

// Create a new schedule
export async function createSchedule(
  data: Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'status'>
): Promise<Schedule> {
  const { data: newSchedule, error } = await supabase
    .from('schedule_periods')
    .insert({
      description: data.name,
      start_date: data.start_date,
      end_date: data.end_date,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  if (!newSchedule) throw new Error('Failed to create schedule')

  return {
    id: newSchedule.id,
    name: newSchedule.description || '',
    description: newSchedule.description,
    start_date: newSchedule.start_date,
    end_date: newSchedule.end_date,
    status: newSchedule.status as Schedule['status'],
    created_at: newSchedule.created_at,
    created_by: newSchedule.created_by,
    updated_at: newSchedule.updated_at,
    updated_by: newSchedule.updated_by
  }
}

// Update a schedule
export async function updateSchedule(
  id: string,
  updateData: ScheduleUpdateData
): Promise<void> {
  const { error } = await supabase
    .from('schedule_periods')
    .update({
      description: updateData.name,
      start_date: updateData.start_date,
      end_date: updateData.end_date,
      status: updateData.status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
}

// Delete a schedule
export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase
    .from('schedule_periods')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Publish a schedule
export async function publishSchedule(id: string): Promise<void> {
  const { error } = await supabase
    .from('schedule_periods')
    .update({
      status: 'published',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
}

// Archive a schedule
export async function archiveSchedule(id: string): Promise<void> {
  const { error } = await supabase
    .from('schedule_periods')
    .update({
      status: 'archived',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
}

// Get staffing requirements for a schedule
export async function getStaffingRequirements(
  scheduleId: string
): Promise<StaffingRequirement[]> {
  const { data, error } = await supabase
    .from('staffing_requirements')
    .select('*')
    .eq('schedule_id', scheduleId)
    .order('day_of_week', { ascending: true })
    .order('time_block_start', { ascending: true })

  if (error) throw error
  if (!data) return []

  return data.map(req => ({
    id: req.id,
    schedule_id: scheduleId,
    name: req.name,
    day_of_week: req.day_of_week,
    time_block_start: req.time_block_start,
    time_block_end: req.time_block_end,
    min_total_staff: req.min_total_staff,
    min_supervisors: req.min_supervisors,
    is_holiday: req.is_holiday,
    override_reason: req.override_reason,
    created_at: req.created_at,
    created_by: req.created_by,
    updated_at: req.updated_at,
    updated_by: req.updated_by
  }))
}

// Update staffing requirements for a schedule
export async function updateStaffingRequirements(
  scheduleId: string,
  requirements: Omit<StaffingRequirement, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>[]
): Promise<void> {
  // First delete existing requirements
  const { error: deleteError } = await supabase
    .from('staffing_requirements')
    .delete()
    .eq('schedule_id', scheduleId)

  if (deleteError) throw deleteError

  // Then insert new requirements
  const { error: insertError } = await supabase
    .from('staffing_requirements')
    .insert(
      requirements.map(req => ({
        ...req,
        schedule_id: scheduleId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    )

  if (insertError) throw insertError
}

// Get current schedule period
export async function getCurrentSchedulePeriod(): Promise<Schedule | null> {
  const now = new Date().toISOString()
  
  const { data, error } = await supabase
    .from('schedule_periods')
    .select('*')
    .eq('status', 'published')
    .lte('start_date', now)
    .gte('end_date', now)
    .single()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    name: data.description || '',
    description: data.description,
    start_date: data.start_date,
    end_date: data.end_date,
    status: data.status as Schedule['status'],
    created_at: data.created_at,
    created_by: data.created_by,
    updated_at: data.updated_at,
    updated_by: data.updated_by
  }
}

// Get next schedule period
export async function getNextSchedulePeriod(): Promise<Schedule | null> {
  const now = new Date().toISOString()
  
  const { data, error } = await supabase
    .from('schedule_periods')
    .select('*')
    .eq('status', 'published')
    .gt('start_date', now)
    .order('start_date', { ascending: true })
    .limit(1)
    .single()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    name: data.description || '',
    description: data.description,
    start_date: data.start_date,
    end_date: data.end_date,
    status: data.status as Schedule['status'],
    created_at: data.created_at,
    created_by: data.created_by,
    updated_at: data.updated_at,
    updated_by: data.updated_by
  }
} 