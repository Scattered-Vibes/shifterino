import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/utils/error-handler'
import { requireManager, requireSupervisorOrAbove } from '@/lib/auth/middleware'
import type { IndividualShift } from '@/types/models/shift'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  ScheduleGenerationParams,
  ScheduleGenerationResult
} from '@/types/models/shift'
import { generateSchedule as generateScheduleImpl } from '@/lib/scheduling/generate'

const schedulePeriodIdSchema = z.string().uuid()

export async function POST(request: Request) {
  try {
    // Verify manager role
    await requireManager()

    const supabase = createClient()
    const req = await request.json()

    // Validate periodId
    const periodId = schedulePeriodIdSchema.parse(req.periodId)

    // Validate params
    const paramsSchema = z.object({
      startDate: z.string(),
      endDate: z.string(), 
      employeeIds: z.array(z.string())
    })
    const params = paramsSchema.parse(req.params)

    // Generate schedule
    const result = await generateScheduleImpl(supabase, periodId, params)

    revalidatePath('/schedule')
    return NextResponse.json(result)

  } catch (error) {
    console.error(error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate schedule'
    }, {
      status: 500
    })
  }
}