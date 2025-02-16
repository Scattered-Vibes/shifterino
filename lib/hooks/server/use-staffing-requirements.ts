import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase/database'
import { z } from 'zod'

type StaffingRequirement = Database['public']['Tables']['staffing_requirements']['Row']

const staffingRequirementSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  min_total_staff: z.number().min(1),
  min_supervisors: z.number().min(1)
})

type StaffingRequirementData = z.infer<typeof staffingRequirementSchema>

export async function getStaffingRequirements() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('staffing_requirements')
    .select('*')
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })
  
  if (error) {
    throw error
  }
  
  return data
}

export async function getStaffingRequirement(requirementId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('staffing_requirements')
    .select('*')
    .eq('id', requirementId)
    .single()
  
  if (error) {
    throw error
  }
  
  return data
}

export async function createStaffingRequirement(data: StaffingRequirementData) {
  const supabase = await createServerSupabaseClient()
  
  // Validate request data
  const validated = staffingRequirementSchema.parse(data)
  
  const { data: newRequirement, error } = await supabase
    .from('staffing_requirements')
    .insert([validated])
    .select()
    .single()
  
  if (error) {
    throw error
  }
  
  return newRequirement
}

export async function updateStaffingRequirement(
  requirementId: string,
  data: Partial<StaffingRequirementData>
) {
  const supabase = await createServerSupabaseClient()
  
  // Validate partial data
  const validated = staffingRequirementSchema.partial().parse(data)
  
  const { data: updatedRequirement, error } = await supabase
    .from('staffing_requirements')
    .update(validated)
    .eq('id', requirementId)
    .select()
    .single()
  
  if (error) {
    throw error
  }
  
  return updatedRequirement
}

export async function deleteStaffingRequirement(requirementId: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('staffing_requirements')
    .delete()
    .eq('id', requirementId)
  
  if (error) {
    throw error
  }
  
  return true
}

export async function getStaffingRequirementsByTimeRange(startTime: string, endTime: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('staffing_requirements')
    .select('*')
    .gte('start_time', startTime)
    .lte('end_time', endTime)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })
  
  if (error) {
    throw error
  }
  
  return data
}

export async function getStaffingRequirementsByDay(dayOfWeek: number) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('staffing_requirements')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .order('start_time', { ascending: true })
  
  if (error) {
    throw error
  }
  
  return data
} 