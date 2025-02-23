import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/index'
import { createApiResponse, handleApiError, requireAuth } from '@/lib/api/utils'
import { generateSchedule as generateScheduleImpl } from '@/lib/scheduling/generate'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase/server'
import { handleError, ErrorCode } from '@/lib/utils/error-handler'

const generateScheduleSchema = z.object({
  periodId: z.string().uuid(),
  params: z.object({
    startDate: z.string(),
    endDate: z.string(),
    employeeIds: z.array(z.string())
  })
})

export async function POST(request: Request) {
  try {
    await requireAuth('manager')
    const supabase = createServerClient()

    // Parse and validate request body
    const body = await request.json()
    const { periodId, params } = generateScheduleSchema.parse(body)

    // Generate schedule
    const result = await generateScheduleImpl(supabase, periodId, params)

    revalidatePath('/schedule')
    return createApiResponse(result)
  } catch (error) {
    return handleApiError(error, 'generate schedule')
  }
}

export async function GET() {
  try {
    const supabase = getServerClient()
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*')
      .order('start_date', { ascending: false })

    if (error) {
      throw handleError(error, ErrorCode.DATABASE_ERROR)
    }

    return NextResponse.json(schedules)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}