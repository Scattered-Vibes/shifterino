'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { StaffingRequirement, StaffingGap } from '@/types/models/schedule'
import type { IndividualShift } from '@/types/models/shift'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/index'

interface StaffingOverviewProps {
  date: Date
}

export function StaffingOverview({ date }: StaffingOverviewProps) {
  const supabase = createClient()

  const { data: staffingLevels } = useQuery({
    queryKey: ['staffing-levels', date.toISOString()],
    queryFn: async () => {
      const [requirementsResult, shiftsResult] = await Promise.all([
        supabase
          .from('staffing_requirements')
          .select('*')
          .eq('day_of_week', date.getDay())
          .order('time_block_start'),
        supabase
          .from('individual_shifts')
          .select('*, shift_option:shift_options(*)')
          .eq('date', date.toISOString().split('T')[0])
      ])

      if (requirementsResult.error) throw requirementsResult.error
      if (shiftsResult.error) throw shiftsResult.error

      const requirements = requirementsResult.data as unknown as StaffingRequirement[]
      const shifts = shiftsResult.data as unknown as IndividualShift[]

      return calculateStaffingLevels(requirements, shifts)
    }
  })

  if (!staffingLevels) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {staffingLevels.map((level) => {
        const percentage = (level.actual_count / level.required_count) * 100
        let progressClass = 'bg-red-500'
        
        if (percentage >= 100) {
          progressClass = 'bg-green-500'
        } else if (percentage >= 75) {
          progressClass = 'bg-yellow-500'
        }

        return (
          <Card key={`${level.time_block_start}-${level.time_block_end}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {formatTimeRange(level.time_block_start, level.time_block_end)}
              </CardTitle>
              <span className={level.missing_supervisor ? 'text-red-500' : 'text-green-500'}>
                {level.missing_supervisor ? 'No Supervisor' : 'Supervisor Present'}
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {level.actual_count} / {level.required_count}
              </div>
              <Progress 
                value={percentage} 
                className={cn("mt-2", progressClass)}
              />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function calculateStaffingLevels(
  requirements: StaffingRequirement[],
  shifts: IndividualShift[]
): StaffingGap[] {
  return requirements.map(req => {
    const shiftsInPeriod = shifts.filter(shift => 
      isShiftInPeriod(shift, req.time_block_start, req.time_block_end)
    )

    const supervisorPresent = shiftsInPeriod.some(shift => 
      shift.shift_option?.requires_supervisor
    )

    return {
      time_block_start: req.time_block_start,
      time_block_end: req.time_block_end,
      required_count: req.min_total_staff,
      actual_count: shiftsInPeriod.length,
      missing_supervisor: !supervisorPresent && req.min_supervisors > 0
    }
  })
}

function isShiftInPeriod(
  shift: IndividualShift,
  periodStart: string,
  periodEnd: string
): boolean {
  const shiftStart = new Date(`1970-01-01T${shift.shift_option?.start_time}`)
  const shiftEnd = new Date(`1970-01-01T${shift.shift_option?.end_time}`)
  const start = new Date(`1970-01-01T${periodStart}`)
  const end = new Date(`1970-01-01T${periodEnd}`)

  return shiftStart <= end && shiftEnd >= start
}

function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} - ${formatTime(end)}`
}

function formatTime(time: string): string {
  return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
} 