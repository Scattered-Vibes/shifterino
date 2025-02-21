import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/index'
import { createApiResponse, handleApiError, requireAuth } from '@/lib/api/utils'
import { generateSchedule as generateScheduleImpl } from '@/lib/scheduling/generate'
import { revalidatePath } from 'next/cache'

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