'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireManager } from '@/lib/auth/middleware'

// Schema for time period requirements
const timePeriodSchema = z.object({
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  minEmployees: z.number().min(1, 'Must have at least 1 employee'),
  minSupervisors: z.number().min(1, 'Must have at least 1 supervisor'),
})

// Schema for the entire form
const staffingRequirementsSchema = z.object({
  earlyMorning: timePeriodSchema,
  dayShift: timePeriodSchema,
  evening: timePeriodSchema,
  overnight: timePeriodSchema,
})

export type StaffingRequirements = z.infer<typeof staffingRequirementsSchema>

export async function getStaffingRequirements() {
  const supabase = createClient()

  // Get current requirements from database
  const { data, error } = await supabase
    .from('staffing_requirements')
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No requirements found, return defaults
      return {
        earlyMorning: {
          startTime: '05:00',
          endTime: '09:00',
          minEmployees: 6,
          minSupervisors: 1,
        },
        dayShift: {
          startTime: '09:00',
          endTime: '21:00',
          minEmployees: 8,
          minSupervisors: 1,
        },
        evening: {
          startTime: '21:00',
          endTime: '01:00',
          minEmployees: 7,
          minSupervisors: 1,
        },
        overnight: {
          startTime: '01:00',
          endTime: '05:00',
          minEmployees: 6,
          minSupervisors: 1,
        },
      }
    }
    throw new Error('Failed to fetch staffing requirements')
  }

  return data
}

export async function updateStaffingRequirements(requirements: StaffingRequirements) {
  // Verify manager role
  await requireManager()

  // Validate requirements
  const validatedData = staffingRequirementsSchema.parse(requirements)

  const supabase = createClient()

  // Update requirements in database
  const { error } = await supabase
    .from('staffing_requirements')
    .upsert(validatedData)

  if (error) {
    throw new Error('Failed to update staffing requirements')
  }

  // Revalidate pages that depend on requirements
  revalidatePath('/requirements')
  revalidatePath('/schedule')
} 