'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireManager } from '@/lib/auth/middleware'
import { handleError, ErrorCode } from '@/lib/utils/error-handler'
import type { Database } from '@/types/database'

type StaffingRequirement = Database['public']['Tables']['staffing_requirements']['Insert']

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

function mapToDbRequirements(requirements: StaffingRequirements): StaffingRequirement[] {
  return [
    {
      name: 'Early Morning',
      time_block_start: requirements.earlyMorning.startTime,
      time_block_end: requirements.earlyMorning.endTime,
      min_total_staff: requirements.earlyMorning.minEmployees,
      min_supervisors: requirements.earlyMorning.minSupervisors,
    },
    {
      name: 'Day Shift',
      time_block_start: requirements.dayShift.startTime,
      time_block_end: requirements.dayShift.endTime,
      min_total_staff: requirements.dayShift.minEmployees,
      min_supervisors: requirements.dayShift.minSupervisors,
    },
    {
      name: 'Evening',
      time_block_start: requirements.evening.startTime,
      time_block_end: requirements.evening.endTime,
      min_total_staff: requirements.evening.minEmployees,
      min_supervisors: requirements.evening.minSupervisors,
    },
    {
      name: 'Overnight',
      time_block_start: requirements.overnight.startTime,
      time_block_end: requirements.overnight.endTime,
      min_total_staff: requirements.overnight.minEmployees,
      min_supervisors: requirements.overnight.minSupervisors,
    },
  ]
}

type DbRequirement = {
  name: string
  time_block_start: string
  time_block_end: string
  min_total_staff: number
  min_supervisors: number
}

function mapFromDbRequirements(requirements: DbRequirement[]): StaffingRequirements {
  const findPeriod = (name: string) => requirements.find(r => r.name === name) || {
    time_block_start: '00:00',
    time_block_end: '00:00',
    min_total_staff: 1,
    min_supervisors: 1,
  }

  const earlyMorning = findPeriod('Early Morning')
  const dayShift = findPeriod('Day Shift')
  const evening = findPeriod('Evening')
  const overnight = findPeriod('Overnight')

  return {
    earlyMorning: {
      startTime: earlyMorning.time_block_start,
      endTime: earlyMorning.time_block_end,
      minEmployees: earlyMorning.min_total_staff,
      minSupervisors: earlyMorning.min_supervisors,
    },
    dayShift: {
      startTime: dayShift.time_block_start,
      endTime: dayShift.time_block_end,
      minEmployees: dayShift.min_total_staff,
      minSupervisors: dayShift.min_supervisors,
    },
    evening: {
      startTime: evening.time_block_start,
      endTime: evening.time_block_end,
      minEmployees: evening.min_total_staff,
      minSupervisors: evening.min_supervisors,
    },
    overnight: {
      startTime: overnight.time_block_start,
      endTime: overnight.time_block_end,
      minEmployees: overnight.min_total_staff,
      minSupervisors: overnight.min_supervisors,
    },
  }
}

export async function getStaffingRequirements() {
  try {
    const supabase = createClient()

    // Get current requirements from database
    const { data, error } = await supabase
      .from('staffing_requirements')
      .select('*')

    if (error) {
      if (error.code === 'PGRST116') {
        // No requirements found, return defaults
        return {
          data: {
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
      }
      const appError = handleError(error)
      return { error: appError.message, code: appError.code }
    }

    return { data: mapFromDbRequirements(data) }
  } catch (error) {
    const appError = handleError(error)
    return { error: appError.message, code: appError.code }
  }
}

export async function updateStaffingRequirements(requirements: StaffingRequirements) {
  try {
    // Verify manager role
    await requireManager()

    // Validate requirements
    try {
      staffingRequirementsSchema.parse(requirements)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          error: 'Invalid staffing requirements format',
          code: ErrorCode.VALIDATION_ERROR
        }
      }
      throw error
    }

    const supabase = createClient()

    // Map requirements to database format
    const dbRequirements = mapToDbRequirements(requirements)

    // Update requirements in database
    const { error } = await supabase
      .from('staffing_requirements')
      .upsert(dbRequirements)

    if (error) {
      const appError = handleError(error)
      return { error: appError.message, code: appError.code }
    }

    // Revalidate pages that depend on requirements
    revalidatePath('/requirements')
    revalidatePath('/schedule')
    
    return { success: true }
  } catch (error) {
    const appError = handleError(error)
    return { error: appError.message, code: appError.code }
  }
} 